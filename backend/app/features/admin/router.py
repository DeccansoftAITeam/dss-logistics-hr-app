"""
Admin router for triggering ingestion and synchronization.
"""

import subprocess
import sys
from pathlib import Path
from fastapi import APIRouter, BackgroundTasks, Depends
from app.core.auth import AuthenticatedUser, require_hr_ops

router = APIRouter(prefix="/admin", tags=["Admin"])


def run_ingestion_process():
    repo_root = Path(__file__).resolve().parent.parent.parent.parent
    script_path = repo_root / "scripts" / "ingest.py"
    if script_path.exists():
        subprocess.run([sys.executable, str(script_path)], cwd=str(repo_root), check=False)


@router.post("/ingest")
async def trigger_ingest(
    background_tasks: BackgroundTasks,
    user: AuthenticatedUser = Depends(require_hr_ops),
):
    """Trigger synthetic policy corpus re-ingestion."""
    background_tasks.add_task(run_ingestion_process)
    return {"status": "accepted", "message": "Corpus ingestion scheduled in background."}
