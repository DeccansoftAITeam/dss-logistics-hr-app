"""
Database models for DSS Ask Policy RAG engine, conversations, evaluations, and observability.
"""

import uuid
from datetime import date, datetime
from typing import Any

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    ARRAY,
    Boolean,
    Computed,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, TSVECTOR, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class AudienceGroup(Base):
    __tablename__ = "audience_groups"

    key: Mapped[str] = mapped_column(String, primary_key=True)
    label: Mapped[str] = mapped_column(String, nullable=False)


class Policy(Base):
    __tablename__ = "policies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doc_id: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)
    region_scope: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    versions: Mapped[list["PolicyVersion"]] = relationship(
        "PolicyVersion", back_populates="policy", cascade="all, delete-orphan", lazy="selectin"
    )


class PolicyVersion(Base):
    __tablename__ = "policy_versions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    policy_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("policies.id", ondelete="CASCADE"), nullable=False
    )
    version_label: Mapped[str] = mapped_column(String, nullable=False)
    effective_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_current: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    r2_object_key: Mapped[str] = mapped_column(String, nullable=False)
    content_sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String, default="current", nullable=False)
    ingested_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    policy: Mapped["Policy"] = relationship("Policy", back_populates="versions")
    audiences: Mapped[list["PolicyAudience"]] = relationship(
        "PolicyAudience", back_populates="policy_version", cascade="all, delete-orphan", lazy="selectin"
    )
    sections: Mapped[list["PolicySection"]] = relationship(
        "PolicySection", back_populates="policy_version", cascade="all, delete-orphan", lazy="selectin"
    )


class PolicyAudience(Base):
    __tablename__ = "policy_audiences"

    policy_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("policy_versions.id", ondelete="CASCADE"), primary_key=True
    )
    audience_group: Mapped[str] = mapped_column(
        String, ForeignKey("audience_groups.key"), primary_key=True
    )

    policy_version: Mapped["PolicyVersion"] = relationship("PolicyVersion", back_populates="audiences")


class PolicyRelationship(Base):
    __tablename__ = "policy_relationships"

    policy_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("policy_versions.id", ondelete="CASCADE"), primary_key=True
    )
    related_policy_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("policy_versions.id", ondelete="CASCADE"), primary_key=True
    )
    relationship_type: Mapped[str] = mapped_column(String, primary_key=True)
    evidence: Mapped[str | None] = mapped_column(Text, nullable=True)


class PolicySection(Base):
    __tablename__ = "policy_sections"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    policy_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("policy_versions.id", ondelete="CASCADE"), nullable=False
    )
    heading_path: Mapped[str | None] = mapped_column(String, nullable=True)
    ordinal: Mapped[int] = mapped_column(Integer, nullable=False)
    text_content: Mapped[str] = mapped_column(Text, nullable=False)

    policy_version: Mapped["PolicyVersion"] = relationship("PolicyVersion", back_populates="sections")
    chunks: Mapped[list["PolicyChunk"]] = relationship(
        "PolicyChunk", back_populates="section", cascade="all, delete-orphan", lazy="selectin"
    )


class PolicyChunk(Base):
    __tablename__ = "policy_chunks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    section_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("policy_sections.id", ondelete="CASCADE"), nullable=False
    )
    normalized_text_sha256: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    text_content: Mapped[str] = mapped_column(Text, nullable=False)
    token_count: Mapped[int] = mapped_column(Integer, nullable=False)
    search_vector = mapped_column(
        TSVECTOR,
        Computed("to_tsvector('english', text_content)", persisted=True),
    )
    embedding = mapped_column(Vector(1536), nullable=False)
    embedding_model: Mapped[str] = mapped_column(String, default="text-embedding-3-large")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    section: Mapped["PolicySection"] = relationship("PolicySection", back_populates="chunks")


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clerk_user_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    clerk_org_id: Mapped[str] = mapped_column(String, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_message_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    messages: Mapped[list["Message"]] = relationship(
        "Message", back_populates="conversation", cascade="all, delete-orphan", lazy="selectin"
    )


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    outcome: Mapped[str | None] = mapped_column(String, nullable=True)
    latency_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="messages")
    citations: Mapped[list["MessageCitation"]] = relationship(
        "MessageCitation", back_populates="message", cascade="all, delete-orphan", lazy="selectin"
    )


class MessageCitation(Base):
    __tablename__ = "message_citations"

    message_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("messages.id", ondelete="CASCADE"), primary_key=True
    )
    policy_chunk_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("policy_chunks.id"), primary_key=True
    )
    citation_index: Mapped[int] = mapped_column(Integer, primary_key=True)

    message: Mapped["Message"] = relationship("Message", back_populates="citations")
    chunk: Mapped["PolicyChunk"] = relationship("PolicyChunk", lazy="selectin")


class Escalation(Base):
    __tablename__ = "escalations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("messages.id"), nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    confirmation_token: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    status: Mapped[str] = mapped_column(String, default="draft", nullable=False)
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    jira_project_key: Mapped[str | None] = mapped_column(String, nullable=True)
    jira_issue_key: Mapped[str | None] = mapped_column(String, nullable=True)
    jira_queue: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class RequestTrace(Base):
    __tablename__ = "request_traces"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clerk_user_id: Mapped[str] = mapped_column(String, nullable=False)
    conversation_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=True
    )
    message_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("messages.id"), nullable=True
    )
    outcome: Mapped[str] = mapped_column(String, nullable=False)
    release_version: Mapped[str] = mapped_column(String, nullable=False)
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    spans: Mapped[list["TraceSpan"]] = relationship(
        "TraceSpan", back_populates="request", cascade="all, delete-orphan", lazy="selectin"
    )


class TraceSpan(Base):
    __tablename__ = "trace_spans"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("request_traces.id", ondelete="CASCADE"), nullable=False
    )
    ordinal: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    detail: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict, nullable=False)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)

    request: Mapped["RequestTrace"] = relationship("RequestTrace", back_populates="spans")


class EvalGoldCase(Base):
    __tablename__ = "eval_gold_cases"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    persona: Mapped[str] = mapped_column(String, nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    expected_behavior: Mapped[str] = mapped_column(String, nullable=False)
    expected_citation_doc_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("policies.doc_id"), nullable=True
    )
    must_not_retrieve_doc_ids: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)
    split: Mapped[str] = mapped_column(String, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class EvalRun(Base):
    __tablename__ = "eval_runs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_label: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    candidate_release: Mapped[str] = mapped_column(String, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    correctness_pct: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    must_escalate_recall_pct: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    unnecessary_escalation_pct: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)
    latency_p50_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    latency_p95_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    release_blockers_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    gate_result: Mapped[str | None] = mapped_column(String, nullable=True)
    approved_by: Mapped[str | None] = mapped_column(String, nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    report_sha: Mapped[str | None] = mapped_column(String, nullable=True)

    case_results: Mapped[list["EvalCaseResult"]] = relationship(
        "EvalCaseResult", back_populates="eval_run", cascade="all, delete-orphan", lazy="selectin"
    )


class EvalCaseResult(Base):
    __tablename__ = "eval_case_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    eval_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("eval_runs.id", ondelete="CASCADE"), nullable=False
    )
    gold_case_id: Mapped[str] = mapped_column(String, ForeignKey("eval_gold_cases.id"), nullable=False)
    retrieved_doc_ids: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)
    answer_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    verdict: Mapped[str] = mapped_column(String, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    eval_run: Mapped["EvalRun"] = relationship("EvalRun", back_populates="case_results")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False, default="User")  # Admin, HR, User
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending_approval")  # verified, pending_approval, rejected
    clerk_user_id: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

