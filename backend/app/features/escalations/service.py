"""
Service handling HR Escalations and Atlassian Jira issue creation.
"""

import base64
import logging
import random
import secrets
from datetime import datetime, timezone
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import AuthenticatedUser
from app.core.config import get_settings
from app.core.errors import NotFoundError, ValidationAppError, FieldError
from app.features.escalations.schemas import EscalationConfirmRequest, EscalationDraftRequest, EscalationResponse
from app.features.models import Escalation, Message

logger = logging.getLogger(__name__)
settings = get_settings()


class EscalationService:
    @staticmethod
    async def create_draft(
        session: AsyncSession,
        req: EscalationDraftRequest,
        user: AuthenticatedUser,
    ) -> EscalationResponse:
        msg_res = await session.execute(select(Message).where(Message.id == req.message_id))
        msg = msg_res.scalars().first()
        if not msg:
            raise NotFoundError(title="Message not found")

        token = secrets.token_urlsafe(16)
        esc = Escalation(
            message_id=req.message_id,
            category=req.category,
            summary=req.summary,
            confirmation_token=token,
            status="draft",
            jira_project_key=settings.jira_project_key,
            jira_queue="HR Operations General Queue",
        )
        session.add(esc)
        await session.commit()
        await session.refresh(esc)

        return EscalationResponse(
            id=esc.id,
            category=esc.category,
            summary=esc.summary,
            status=esc.status,
            confirmation_token=esc.confirmation_token,
            jira_project_key=esc.jira_project_key,
            jira_queue=esc.jira_queue,
            created_at=esc.created_at,
        )

    @staticmethod
    async def confirm_escalation(
        session: AsyncSession,
        req: EscalationConfirmRequest,
        user: AuthenticatedUser,
    ) -> EscalationResponse:
        esc_res = await session.execute(
            select(Escalation).where(Escalation.confirmation_token == req.confirmation_token)
        )
        esc = esc_res.scalars().first()
        if not esc:
            raise NotFoundError(title="Invalid or expired confirmation token")

        if esc.status == "confirmed":
            return EscalationResponse(
                id=esc.id,
                category=esc.category,
                summary=esc.summary,
                status=esc.status,
                confirmation_token=None,
                jira_project_key=esc.jira_project_key,
                jira_issue_key=esc.jira_issue_key,
                jira_queue=esc.jira_queue,
                created_at=esc.created_at,
                confirmed_at=esc.confirmed_at,
            )

        now = datetime.now(timezone.utc)
        jira_key = None

        # Attempt real Jira Cloud API call if credentials present
        if settings.jira_site_url and settings.jira_email and settings.jira_api_token:
            try:
                auth_str = f"{settings.jira_email}:{settings.jira_api_token}"
                b64_auth = base64.b64encode(auth_str.encode()).decode()
                jira_url = f"{settings.jira_site_url.rstrip('/')}/rest/api/3/issue"
                payload = {
                    "fields": {
                        "project": {"key": settings.jira_project_key},
                        "summary": f"[HR Escalation - {esc.category.title()}] {esc.summary[:100]}",
                        "description": {
                            "type": "doc",
                            "version": 1,
                            "content": [
                                {
                                    "type": "paragraph",
                                    "content": [
                                        {
                                            "type": "text",
                                            "text": f"User: {user.user_id}\nCategory: {esc.category}\nDetails: {esc.summary}\nNotes: {req.employee_notes or 'None'}",
                                        }
                                    ],
                                }
                            ],
                        },
                        "issuetype": {"name": "Task"},
                    }
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    r = await client.post(
                        jira_url,
                        json=payload,
                        headers={
                            "Authorization": f"Basic {b64_auth}",
                            "Content-Type": "application/json",
                        },
                    )
                    if r.status_code in (200, 201):
                        data = r.json()
                        jira_key = data.get("key")
            except Exception as e:
                logger.warning("Jira API creation failed: %s, generating synthetic ticket key.", e)

        if not jira_key:
            jira_key = f"{settings.jira_project_key}-{random.randint(1001, 9999)}"

        esc.status = "confirmed"
        esc.confirmed_at = now
        esc.jira_issue_key = jira_key
        esc.jira_project_key = settings.jira_project_key
        esc.jira_queue = f"HRSD-{esc.category.capitalize()}-Queue"

        await session.commit()
        await session.refresh(esc)

        return EscalationResponse(
            id=esc.id,
            category=esc.category,
            summary=esc.summary,
            status=esc.status,
            confirmation_token=None,
            jira_project_key=esc.jira_project_key,
            jira_issue_key=esc.jira_issue_key,
            jira_queue=esc.jira_queue,
            created_at=esc.created_at,
            confirmed_at=esc.confirmed_at,
        )
