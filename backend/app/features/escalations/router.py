"""
FastAPI Router for Escalations.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.db import get_db
from app.features.escalations.schemas import EscalationConfirmRequest, EscalationDraftRequest, EscalationResponse
from app.features.escalations.service import EscalationService

router = APIRouter(prefix="/escalate", tags=["Escalations"])
service = EscalationService()


@router.post("/draft", response_model=EscalationResponse)
async def draft_escalation(
    req: EscalationDraftRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a draft escalation for an employee interaction."""
    return await service.create_draft(session=db, req=req, user=user)


@router.post("/confirm", response_model=EscalationResponse)
async def confirm_escalation(
    req: EscalationConfirmRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Confirm an escalation draft, generating a ticket in Jira HRSD."""
    return await service.confirm_escalation(session=db, req=req, user=user)
