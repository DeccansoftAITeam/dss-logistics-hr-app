"""
Pydantic schemas for HR Escalations.
"""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class EscalationDraftRequest(BaseModel):
    message_id: UUID
    category: str = Field(..., description="separation | disciplinary | medical | legal | policy_conflict")
    summary: str = Field(..., min_length=5, max_length=1000)


class EscalationConfirmRequest(BaseModel):
    confirmation_token: str
    employee_notes: str | None = None


class EscalationResponse(BaseModel):
    id: UUID
    category: str
    summary: str
    status: str
    confirmation_token: str | None = None
    jira_project_key: str | None = None
    jira_issue_key: str | None = None
    jira_queue: str | None = None
    created_at: datetime
    confirmed_at: datetime | None = None
