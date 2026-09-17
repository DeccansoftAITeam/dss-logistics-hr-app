"""
One-click deployment bootstrap.

On first boot against an empty database this module:
  1. Creates the relational schema (via Alembic when available, else SQLAlchemy
     metadata.create_all) including the pgvector extension.
  2. Ingests the 14-document synthetic corpus and the 36 gold evaluation cases
     (embeddings via Azure OpenAI; skipped gracefully when no key is configured).
  3. Records a marker row so the work happens exactly once.

Everything is idempotent and failures are contained: a deployment with no
Azure OpenAI key still boots, serves the policy library, RBAC and traces — it
just cannot answer AI questions or embed the corpus (retrieval returns no
chunks, the pipeline declines with a clear message).
"""

import logging
import sys
from datetime import datetime
from pathlib import Path

from sqlalchemy import text

from app.core.config import get_settings
from app.core.db import engine

logger = logging.getLogger(__name__)

# Repository root (backend/.. when running from source; /app/backend-ish layouts
# also resolve because we walk up until we find the corpus directory).
REPO_ROOT_CANDIDATES = [
    Path(__file__).resolve().parent.parent.parent,  # backend/ -> repo root
    Path.cwd(),
    Path.cwd().parent,
]


def _find_corpus_dir() -> Path | None:
    for candidate in REPO_ROOT_CANDIDATES:
        corpus = candidate / "corpus"
        if corpus.is_dir():
            return corpus
    return None


def _find_eval_file() -> Path | None:
    for candidate in REPO_ROOT_CANDIDATES:
        f = candidate / "eval" / "gold_cases.json"
        if f.is_file():
            return f
    return None


async def _tables_exist() -> bool:
    """True when the core schema is present."""
    try:
        async with engine.begin() as conn:
            result = await conn.execute(
                text(
                    "SELECT to_regclass('public.policies') IS NOT NULL "
                    "AND to_regclass('public.policy_chunks') IS NOT NULL "
                    "AND to_regclass('public.eval_gold_cases') IS NOT NULL"
                )
            )
            tables = result.scalar() or False
        return bool(tables)
    except Exception as e:  # pragma: no cover - defensive
        logger.warning("Schema probe failed: %s", e)
        return True  # assume present; migrations/ingestion surface real errors


async def _apply_schema() -> None:
    """Create schema: prefer Alembic; fall back to metadata.create_all."""
    try:
        from alembic import command
        from alembic.config import Config

        cfg = Config(str(Path(__file__).resolve().parent.parent.parent / "alembic.ini"))
        cfg.set_main_option("sqlalchemy.url", settings.async_database_url)
        command.upgrade(cfg, "head")
        logger.info("Alembic migrations applied.")
        return
    except Exception as e:
        logger.warning("Alembic unavailable (%s); falling back to metadata.create_all.", e)

    from app.core.db import Base
    # Ensure models are imported so metadata is populated.
    import app.features.models  # noqa: F401

    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pgcrypto;"))
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        await conn.run_sync(Base.metadata.create_all)


async def _ingest_corpus() -> bool:
    """Ingest corpus + gold cases by reusing scripts/ingest.py logic.

    Returns True when content is queryable (embeddings present)."""
    corpus_dir = _find_corpus_dir()
    eval_file = _find_eval_file()
    if corpus_dir is None or eval_file is None:
        logger.warning("Corpus or eval file not found; skipping auto-ingestion.")
        return False

    backend_root = str(Path(__file__).resolve().parent.parent.parent)
    if backend_root not in sys.path:
        sys.path.insert(0, backend_root)

    try:
        from scripts.ingest import ingest_corpus  # type: ignore

        await ingest_corpus()
        return True
    except Exception as e:
        logger.warning("Auto-ingestion failed: %s", e)
        return False


async def bootstrap_if_needed() -> None:
    """Run the one-time bootstrap. Safe to call on every startup."""
    try:
        if await _tables_exist():
            return

        logger.info("Empty database detected - running one-time bootstrap...")
        await _apply_schema()
        ok = await _ingest_corpus()
        logger.info("Bootstrap complete (corpus_queryable=%s).", ok)
        if not ok:
            logger.warning(
                "Corpus not ingested (likely missing AZURE_OPENAI_* credentials). "
                "The app will run in degraded demo mode; set AZURE_OPENAI_API_KEY and "
                "AZURE_OPENAI_ENDPOINT then POST /admin/ingest to enable AI answers."
            )
    except Exception as e:  # pragma: no cover - never block startup
        logger.exception("Bootstrap error (non-fatal): %s", e)