"""Initial schema for DSS Ask Policy

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-09-16 13:42:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import pgvector
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Ensure extensions
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")

    # 1. audience_groups
    op.execute("""
    CREATE TABLE IF NOT EXISTS audience_groups (
        key text PRIMARY KEY,
        label text NOT NULL
    );
    """)

    # Seed audience groups
    op.execute("""
    INSERT INTO audience_groups (key, label) VALUES
        ('all-employees', 'All Employees'),
        ('india-employees', 'India Employees'),
        ('us-employees', 'US Employees'),
        ('hr-managers', 'HR Managers'),
        ('people-managers', 'People Managers')
    ON CONFLICT (key) DO NOTHING;
    """)

    # 2. policies
    op.execute("""
    CREATE TABLE IF NOT EXISTS policies (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        doc_id text UNIQUE NOT NULL,
        title text NOT NULL,
        category text NOT NULL,
        region_scope text,
        created_at timestamptz NOT NULL DEFAULT now()
    );
    """)

    # 3. policy_versions
    op.execute("""
    CREATE TABLE IF NOT EXISTS policy_versions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        policy_id uuid NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
        version_label text NOT NULL,
        effective_date date NOT NULL,
        is_current boolean NOT NULL DEFAULT true,
        r2_object_key text NOT NULL,
        content_sha256 char(64) NOT NULL,
        extracted_text text,
        status text NOT NULL CHECK (status IN ('draft','current','superseded','restricted_pending')),
        ingested_at timestamptz,
        synced_at timestamptz,
        UNIQUE (policy_id, version_label)
    );
    """)
    op.execute("""
    CREATE UNIQUE INDEX IF NOT EXISTS one_current_version ON policy_versions (policy_id) WHERE is_current;
    """)

    # 4. policy_audiences
    op.execute("""
    CREATE TABLE IF NOT EXISTS policy_audiences (
        policy_version_id uuid NOT NULL REFERENCES policy_versions(id) ON DELETE CASCADE,
        audience_group text NOT NULL REFERENCES audience_groups(key),
        PRIMARY KEY (policy_version_id, audience_group)
    );
    """)

    # 5. policy_relationships
    op.execute("""
    CREATE TABLE IF NOT EXISTS policy_relationships (
        policy_version_id uuid NOT NULL REFERENCES policy_versions(id) ON DELETE CASCADE,
        related_policy_version_id uuid NOT NULL REFERENCES policy_versions(id) ON DELETE CASCADE,
        relationship_type text NOT NULL CHECK (relationship_type IN ('supersedes', 'regional_addendum_of', 'conflicts_with')),
        evidence text,
        PRIMARY KEY (policy_version_id, related_policy_version_id, relationship_type),
        CHECK (policy_version_id <> related_policy_version_id)
    );
    """)

    # 6. policy_sections
    op.execute("""
    CREATE TABLE IF NOT EXISTS policy_sections (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        policy_version_id uuid NOT NULL REFERENCES policy_versions(id) ON DELETE CASCADE,
        heading_path text,
        ordinal int NOT NULL,
        text_content text NOT NULL
    );
    """)

    # 7. policy_chunks
    op.execute("""
    CREATE TABLE IF NOT EXISTS policy_chunks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        section_id uuid NOT NULL REFERENCES policy_sections(id) ON DELETE CASCADE,
        normalized_text_sha256 char(64) UNIQUE NOT NULL,
        text_content text NOT NULL,
        token_count int NOT NULL,
        search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', text_content)) STORED,
        embedding vector(1536) NOT NULL,
        embedding_model text NOT NULL DEFAULT 'text-embedding-3-large',
        created_at timestamptz NOT NULL DEFAULT now()
    );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS policy_chunks_search_idx ON policy_chunks USING gin (search_vector);")
    op.execute("CREATE INDEX IF NOT EXISTS policy_chunks_embedding_idx ON policy_chunks USING hnsw (embedding vector_cosine_ops);")

    # 8. conversations
    op.execute("""
    CREATE TABLE IF NOT EXISTS conversations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        clerk_user_id text NOT NULL,
        clerk_org_id text NOT NULL,
        started_at timestamptz NOT NULL DEFAULT now(),
        last_message_at timestamptz NOT NULL DEFAULT now()
    );
    """)

    # 9. messages
    op.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        role text NOT NULL CHECK (role IN ('user','assistant')),
        content text NOT NULL,
        outcome text CHECK (outcome IN ('answered','declined','escalated','redirected')),
        latency_ms int,
        created_at timestamptz NOT NULL DEFAULT now()
    );
    """)

    # 10. message_citations
    op.execute("""
    CREATE TABLE IF NOT EXISTS message_citations (
        message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        policy_chunk_id uuid NOT NULL REFERENCES policy_chunks(id),
        citation_index int NOT NULL,
        PRIMARY KEY (message_id, citation_index)
    );
    """)

    # 11. escalations
    op.execute("""
    CREATE TABLE IF NOT EXISTS escalations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        message_id uuid NOT NULL REFERENCES messages(id),
        category text NOT NULL,
        summary text NOT NULL,
        confirmation_token text NOT NULL UNIQUE,
        status text NOT NULL CHECK (status IN ('draft','confirmed','cancelled')) DEFAULT 'draft',
        confirmed_at timestamptz,
        jira_project_key text,
        jira_issue_key text,
        jira_queue text,
        created_at timestamptz NOT NULL DEFAULT now()
    );
    """)

    # 12. request_traces
    op.execute("""
    CREATE TABLE IF NOT EXISTS request_traces (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        clerk_user_id text NOT NULL,
        conversation_id uuid REFERENCES conversations(id),
        message_id uuid REFERENCES messages(id),
        outcome text NOT NULL CHECK (outcome IN ('answered','declined','escalated','redirected')),
        release_version text NOT NULL,
        latency_ms int NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
    );
    """)

    # 13. trace_spans
    op.execute("""
    CREATE TABLE IF NOT EXISTS trace_spans (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id uuid NOT NULL REFERENCES request_traces(id) ON DELETE CASCADE,
        ordinal int NOT NULL,
        name text NOT NULL CHECK (name IN ('auth','permission_filter','retrieval','graph_expand','model_call','citation_check','escalation_tool','outcome')),
        status text NOT NULL CHECK (status IN ('ok','skip','bad')),
        detail jsonb NOT NULL DEFAULT '{}',
        duration_ms int
    );
    """)

    # 14. eval_gold_cases
    op.execute("""
    CREATE TABLE IF NOT EXISTS eval_gold_cases (
        id text PRIMARY KEY,
        persona text NOT NULL,
        question text NOT NULL,
        expected_behavior text NOT NULL CHECK (expected_behavior IN ('answer','refuse','escalate','redirect')),
        expected_citation_doc_id text REFERENCES policies(doc_id),
        must_not_retrieve_doc_ids text[] NOT NULL DEFAULT '{}',
        split text NOT NULL CHECK (split IN ('dev','holdout')),
        notes text
    );
    """)

    # 15. eval_runs
    op.execute("""
    CREATE TABLE IF NOT EXISTS eval_runs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        run_label text UNIQUE NOT NULL,
        candidate_release text NOT NULL,
        started_at timestamptz NOT NULL DEFAULT now(),
        completed_at timestamptz,
        correctness_pct numeric(5,2),
        must_escalate_recall_pct numeric(5,2),
        unnecessary_escalation_pct numeric(5,2),
        latency_p50_ms int,
        latency_p95_ms int,
        release_blockers_count int NOT NULL DEFAULT 0,
        gate_result text CHECK (gate_result IN ('pass','fail')),
        approved_by text,
        approved_at timestamptz,
        report_sha text
    );
    """)

    # 16. eval_case_results
    op.execute("""
    CREATE TABLE IF NOT EXISTS eval_case_results (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        eval_run_id uuid NOT NULL REFERENCES eval_runs(id) ON DELETE CASCADE,
        gold_case_id text NOT NULL REFERENCES eval_gold_cases(id),
        retrieved_doc_ids text[] NOT NULL DEFAULT '{}',
        answer_text text,
        verdict text NOT NULL CHECK (verdict IN ('pass','partial','fail')),
        notes text
    );
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS eval_case_results CASCADE;")
    op.execute("DROP TABLE IF EXISTS eval_runs CASCADE;")
    op.execute("DROP TABLE IF EXISTS eval_gold_cases CASCADE;")
    op.execute("DROP TABLE IF EXISTS trace_spans CASCADE;")
    op.execute("DROP TABLE IF EXISTS request_traces CASCADE;")
    op.execute("DROP TABLE IF EXISTS escalations CASCADE;")
    op.execute("DROP TABLE IF EXISTS message_citations CASCADE;")
    op.execute("DROP TABLE IF EXISTS messages CASCADE;")
    op.execute("DROP TABLE IF EXISTS conversations CASCADE;")
    op.execute("DROP TABLE IF EXISTS policy_chunks CASCADE;")
    op.execute("DROP TABLE IF EXISTS policy_sections CASCADE;")
    op.execute("DROP TABLE IF EXISTS policy_relationships CASCADE;")
    op.execute("DROP TABLE IF EXISTS policy_audiences CASCADE;")
    op.execute("DROP TABLE IF EXISTS policy_versions CASCADE;")
    op.execute("DROP TABLE IF EXISTS policies CASCADE;")
    op.execute("DROP TABLE IF EXISTS audience_groups CASCADE;")
