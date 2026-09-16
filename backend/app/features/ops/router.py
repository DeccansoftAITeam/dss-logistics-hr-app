"""
FastAPI Router for HR Ops endpoints.
Requires HR Ops role (org:role:hr-ops).
"""

from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import AuthenticatedUser, get_current_user, require_admin, require_hr_ops
from app.core.db import get_db
from app.features.ops.schemas import (
    ConversationSummary,
    CurrentUserResponse,
    CreateUserRequest,
    OverviewStats,
    PolicyLibraryItem,
    ReclassifyRequest,
    UpdateUserStatusRequest,
    UserProfileItem,
)
from app.features.ops.service import OpsService

router = APIRouter(prefix="/ops", tags=["HR Ops Console"])
service = OpsService()


@router.get("/overview", response_model=OverviewStats)
async def get_overview(
    user: AuthenticatedUser = Depends(require_hr_ops),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve top-level health, latency, conversation volume, and evaluation gates."""
    return await service.get_overview(session=db)


@router.get("/conversations", response_model=list[ConversationSummary])
async def list_conversations(
    limit: int = Query(default=50, le=100),
    user: AuthenticatedUser = Depends(require_hr_ops),
    db: AsyncSession = Depends(get_db),
):
    """List recent employee conversations with message counts and status."""
    return await service.get_conversations(session=db, limit=limit)


@router.get("/conversations/{conversation_id}/trace")
async def get_conversation_trace(
    conversation_id: UUID,
    user: AuthenticatedUser = Depends(require_hr_ops),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve end-to-end execution trace, spans, and retrieval diagnostics for a conversation."""
    return await service.get_conversation_trace(session=db, conversation_id=conversation_id)


@router.get("/library", response_model=list[PolicyLibraryItem])
async def get_policy_library(
    user: AuthenticatedUser = Depends(require_hr_ops),
    db: AsyncSession = Depends(get_db),
):
    """List published policy documents, current versions, allowed audiences, and graph relationships."""
    return await service.get_policy_library(session=db)


@router.post("/library/{doc_id}/reclassify")
async def reclassify_policy(
    doc_id: str,
    req: ReclassifyRequest,
    user: AuthenticatedUser = Depends(require_hr_ops),
    db: AsyncSession = Depends(get_db),
):
    """
    Simulate incident mitigation by reclassifying a policy's audience
    (e.g., POL-HR-012 PIP Handbook from all-employees to people-managers).
    """
    return await service.reclassify_policy(
        session=db,
        doc_id=doc_id,
        target_audiences=req.target_audience,
    )


@router.get("/quality")
async def get_quality_dashboard(
    user: AuthenticatedUser = Depends(require_hr_ops),
    db: AsyncSession = Depends(get_db),
):
    """Inspect gold evaluation dataset results and historical gate runs."""
    return await service.get_quality_dashboard(session=db)


@router.post("/eval/trigger")
async def trigger_eval(
    split: str = Query(default="dev", pattern="^(dev|holdout|all)$"),
    user: AuthenticatedUser = Depends(require_hr_ops),
    db: AsyncSession = Depends(get_db),
):
    """Trigger an on-demand evaluation run against the gold set."""
    split_filter = None if split == "all" else split
    eval_run = await service.trigger_eval_run(session=db, split_filter=split_filter)
    return {
        "run_id": eval_run.id,
        "run_label": eval_run.run_label,
        "correctness_pct": float(eval_run.correctness_pct or 0.0),
        "gate_result": eval_run.gate_result,
        "blockers": eval_run.release_blockers_count,
        "latency_p95_ms": eval_run.latency_p95_ms,
    }


@router.get("/me", response_model=CurrentUserResponse)
async def get_me(user: AuthenticatedUser = Depends(get_current_user)):
    """Return profile and permissions for the currently authenticated caller."""
    return CurrentUserResponse(
        user_id=user.user_id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        status=user.status,
        is_hr_ops=user.is_hr_ops,
        allowed_groups=user.allowed_groups,
    )


@router.get("/users", response_model=list[UserProfileItem])
async def list_users(
    user: AuthenticatedUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all registered and pending users (Admin only)."""
    return await service.get_users(session=db)


@router.post("/users/{user_id}/status", response_model=UserProfileItem)
async def update_user_status(
    user_id: UUID,
    req: UpdateUserStatusRequest,
    user: AuthenticatedUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Approve or reject a user, or change their role (Admin only)."""
    return await service.update_user_status(
        session=db, user_id=user_id, status=req.status, role=req.role
    )


@router.post("/users", response_model=UserProfileItem)
async def create_user(
    req: CreateUserRequest,
    user: AuthenticatedUser = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Pre-register a new employee profile (Admin only)."""
    return await service.create_user(
        session=db, email=req.email, full_name=req.full_name, role=req.role, status=req.status
    )

