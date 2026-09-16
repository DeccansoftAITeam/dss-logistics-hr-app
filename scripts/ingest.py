"""
Corpus Ingestion & Seeding Script for DSS Ask Policy.
- Parses YAML frontmatter from corpus/*.md
- Uploads documents to Azure Blob Storage container
- Chunks text by markdown sections and generates embeddings with Azure OpenAI text-embedding-3-large
- Populates PostgreSQL schema: policies, policy_versions, policy_audiences, policy_relationships, policy_sections, policy_chunks
- Seeds eval_gold_cases from eval/gold_cases.json
"""

import asyncio
import hashlib
import json
import os
import re
from datetime import datetime, date
from pathlib import Path
import yaml
from openai import AzureOpenAI
from azure.storage.blob import BlobServiceClient
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from dotenv import load_dotenv

load_dotenv()

CORPUS_DIR = Path(__file__).resolve().parent.parent / "corpus"
EVAL_FILE = Path(__file__).resolve().parent.parent / "eval" / "gold_cases.json"

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+asyncpg://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
if "oregon-postgres.render.com" in DATABASE_URL and "ssl=" not in DATABASE_URL and "sslmode=" not in DATABASE_URL:
    connector = "&" if "?" in DATABASE_URL else "?"
    DATABASE_URL = f"{DATABASE_URL}{connector}ssl=require"

AZURE_STORAGE_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
AZURE_STORAGE_CONTAINER = os.getenv("AZURE_STORAGE_CONTAINER", "dss-ask-policy-content")

AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_EMBEDDING_DEPLOYMENT = os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT", "text-embedding-3-large")

# Setup Azure OpenAI client for embeddings
ai_client = AzureOpenAI(
    azure_endpoint=AZURE_OPENAI_ENDPOINT,
    api_key=AZURE_OPENAI_API_KEY,
    api_version="2024-02-01",
)

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, expire_on_commit=False)


def get_embedding(text: str) -> list[float]:
    response = ai_client.embeddings.create(
        input=text,
        model=AZURE_OPENAI_EMBEDDING_DEPLOYMENT,
        dimensions=1536,
    )
    return response.data[0].embedding


def upload_blob(blob_name: str, content: str) -> str:
    if not AZURE_STORAGE_CONNECTION_STRING:
        print("Skipping Azure Blob upload: AZURE_STORAGE_CONNECTION_STRING not set")
        return blob_name
    blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
    container_client = blob_service_client.get_container_client(AZURE_STORAGE_CONTAINER)
    try:
        container_client.create_container()
    except Exception:
        pass
    blob_client = container_client.get_blob_client(blob_name)
    blob_client.upload_blob(content, overwrite=True)
    return blob_name


def parse_markdown_sections(content: str) -> list[tuple[str, str]]:
    """Splits markdown content into (heading_path, section_text) tuples."""
    lines = content.splitlines()
    sections = []
    current_heading = "Overview"
    current_lines = []

    for line in lines:
        if line.startswith("#"):
            if current_lines:
                text = "\n".join(current_lines).strip()
                if text:
                    sections.append((current_heading, text))
                current_lines = []
            current_heading = line.lstrip("#").strip()
        else:
            current_lines.append(line)

    if current_lines:
        text = "\n".join(current_lines).strip()
        if text:
            sections.append((current_heading, text))

    return sections


async def ingest_corpus():
    print("--- Starting DSS Ask Policy Ingestion ---")
    files = sorted(CORPUS_DIR.glob("*.md"))
    print(f"Found {len(files)} policy markdown documents in {CORPUS_DIR}")

    parsed_docs = []
    for file_path in files:
        raw_text = file_path.read_text(encoding="utf-8")
        frontmatter_match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", raw_text, re.DOTALL)
        if not frontmatter_match:
            print(f"Skipping {file_path.name}: no frontmatter")
            continue
        fm_raw, body = frontmatter_match.groups()
        meta = yaml.safe_load(fm_raw)
        parsed_docs.append((file_path.name, meta, body.strip(), raw_text))

    async with async_session() as session:
        # Import models inside function to avoid circular or path issues
        import sys
        sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))
        from app.features.models import (
            Policy,
            PolicyVersion,
            PolicyAudience,
            PolicyRelationship,
            PolicySection,
            PolicyChunk,
            EvalGoldCase,
        )

        version_lookup = {}  # (doc_id, version_label): PolicyVersion

        for fname, meta, body, raw_text in parsed_docs:
            doc_id = meta["doc_id"]
            title = meta["title"]
            category = meta["category"]
            region_scope = meta.get("region_scope")
            version_label = str(meta["version"])
            effective_date = datetime.strptime(str(meta["effective_date"]), "%Y-%m-%d").date()
            status = meta.get("status", "current")
            is_current = (status == "current")
            content_sha256 = hashlib.sha256(raw_text.encode("utf-8")).hexdigest()
            blob_key = f"corpus/{doc_id}-v{version_label}.md"

            print(f"\nProcessing {doc_id} v{version_label}: '{title}' (status={status})")

            # 1. Upload to Azure Blob Storage
            upload_blob(blob_key, raw_text)

            # 2. Insert or get Policy
            result = await session.execute(select(Policy).where(Policy.doc_id == doc_id))
            policy = result.scalars().first()
            if not policy:
                policy = Policy(
                    doc_id=doc_id,
                    title=title,
                    category=category,
                    region_scope=region_scope,
                )
                session.add(policy)
                await session.flush()

            # 3. Insert or update PolicyVersion
            v_res = await session.execute(
                select(PolicyVersion).where(
                    PolicyVersion.policy_id == policy.id,
                    PolicyVersion.version_label == version_label,
                )
            )
            version = v_res.scalars().first()
            if not version:
                version = PolicyVersion(
                    policy_id=policy.id,
                    version_label=version_label,
                    effective_date=effective_date,
                    is_current=is_current,
                    r2_object_key=blob_key,
                    content_sha256=content_sha256,
                    extracted_text=body,
                    status=status,
                    ingested_at=datetime.utcnow(),
                    synced_at=datetime.utcnow(),
                )
                session.add(version)
                await session.flush()
            else:
                version.is_current = is_current
                version.extracted_text = body
                version.content_sha256 = content_sha256
                version.status = status
                version.synced_at = datetime.utcnow()
                await session.flush()

            version_lookup[(doc_id, version_label)] = version
            meta["_version_obj"] = version
            meta["_body"] = body

            # 4. Audiences
            await session.execute(
                delete(PolicyAudience).where(PolicyAudience.policy_version_id == version.id)
            )
            audiences = meta.get("audience", [])
            if isinstance(audiences, str):
                audiences = [audiences]
            for aud in audiences:
                session.add(PolicyAudience(policy_version_id=version.id, audience_group=aud))

            # 5. Sections and Chunks
            await session.execute(
                delete(PolicySection).where(PolicySection.policy_version_id == version.id)
            )
            sections = parse_markdown_sections(body)
            for ordinal, (heading, text_content) in enumerate(sections, 1):
                sec = PolicySection(
                    policy_version_id=version.id,
                    heading_path=f"{title} > {heading}",
                    ordinal=ordinal,
                    text_content=text_content,
                )
                session.add(sec)
                await session.flush()

                chunk_text = f"Document: {title} ({doc_id} v{version_label})\nSection: {heading}\n\n{text_content}"
                chunk_sha = hashlib.sha256(chunk_text.strip().encode("utf-8")).hexdigest()
                token_count = max(1, int(len(chunk_text.split()) * 1.3))

                # Generate embedding
                embedding = get_embedding(chunk_text)

                chunk = PolicyChunk(
                    section_id=sec.id,
                    normalized_text_sha256=chunk_sha,
                    text_content=chunk_text,
                    token_count=token_count,
                    embedding=embedding,
                    embedding_model="text-embedding-3-large",
                )
                session.add(chunk)

            await session.commit()
            print(f"  -> Ingested {len(sections)} sections and chunks with 1536-dim embeddings")

        # 6. Establish Relationships
        print("\nEstablishing policy graph relationships...")
        for fname, meta, body, raw_text in parsed_docs:
            v_obj = meta["_version_obj"]
            doc_id = meta["doc_id"]
            supersedes = meta.get("supersedes")
            if supersedes and "v2.0" in str(supersedes):
                # link to v2.0
                old_v = version_lookup.get((doc_id, "2.0"))
                if old_v and old_v.id != v_obj.id:
                    session.add(
                        PolicyRelationship(
                            policy_version_id=v_obj.id,
                            related_policy_version_id=old_v.id,
                            relationship_type="supersedes",
                            evidence=f"{v_obj.version_label} supersedes {old_v.version_label}",
                        )
                    )

            related_id = meta.get("related_policy_id")
            rel_type = meta.get("relationship_type")
            if related_id and rel_type:
                target_v = next((v for (d, vl), v in version_lookup.items() if d == related_id and v.is_current), None)
                if target_v and target_v.id != v_obj.id:
                    session.add(
                        PolicyRelationship(
                            policy_version_id=v_obj.id,
                            related_policy_version_id=target_v.id,
                            relationship_type=rel_type,
                            evidence=f"{doc_id} is {rel_type} {related_id}",
                        )
                    )

            conflicts = meta.get("conflicts_with") or []
            if isinstance(conflicts, str):
                conflicts = [conflicts]
            for conf_doc in conflicts:
                target_v = next((v for (d, vl), v in version_lookup.items() if d == conf_doc and v.is_current), None)
                if target_v and target_v.id != v_obj.id:
                    session.add(
                        PolicyRelationship(
                            policy_version_id=v_obj.id,
                            related_policy_version_id=target_v.id,
                            relationship_type="conflicts_with",
                            evidence=f"Intentional policy conflict between {doc_id} and {conf_doc}",
                        )
                    )

        await session.commit()
        print("Policy graph edges established.")

        # 7. Seed eval_gold_cases
        print("\nSeeding eval_gold_cases from eval/gold_cases.json...")
        with open(EVAL_FILE, "r", encoding="utf-8") as f:
            cases_data = json.load(f)

        await session.execute(delete(EvalGoldCase))
        for c in cases_data:
            gold_case = EvalGoldCase(
                id=c["id"],
                persona=c["persona"],
                question=c["question"],
                expected_behavior=c["expected_behavior"],
                expected_citation_doc_id=c.get("expected_citation_doc_id"),
                must_not_retrieve_doc_ids=c.get("must_not_retrieve_doc_ids", []),
                split=c["split"],
                notes=c.get("notes"),
            )
            session.add(gold_case)

        await session.commit()
        print(f"Successfully seeded {len(cases_data)} gold evaluation cases.")

    print("\n--- Ingestion & Seeding Complete! ---")


if __name__ == "__main__":
    asyncio.run(ingest_corpus())
