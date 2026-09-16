"""
Pydantic schemas for HR Ops console.
"""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class OverviewStats(BaseModel):
    total_conversations: int
    total_messages: int
    total_escalations: int
    confirmed_escalations: int
    latency_p50_ms: int
    latency_p95_ms: int
    eval_pass_rate_pct: float | None = None
    gate_result: str | None = None
    candidate_release: str = "v1.0.0"


class ConversationSummary(BaseModel):
    id: UUID
    user_id: str
    user_email: str | None = None
    user_name: str | None = None
    started_at: datetime
    last_message_at: datetime
    message_count: int
    last_outcome: str | None = None


class PolicyLibraryItem(BaseModel):
    id: UUID
    doc_id: str
    title: str
    category: str
    region_scope: str | None = None
    version_label: str
    effective_date: str
    is_current: bool
    status: str
    audiences: list[str]
    relationships: list[dict] = []
    has_conflicts: bool = False


class QualityMetric(BaseModel):
    run_label: str
    candidate_release: str
    correctness_pct: float
    must_escalate_recall_pct: float
    unnecessary_escalation_pct: float
    latency_p50_ms: int
    latency_p95_ms: int
    release_blockers_count: int
    gate_result: str
    completed_at: datetime | None = None


class ReclassifyRequest(BaseModel):
    target_audience: list[str]


class UserProfileItem(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    status: str
    created_at: datetime


class UpdateUserStatusRequest(BaseModel):
    status: str
    role: str | None = None


class CreateUserRequest(BaseModel):
    email: str
    full_name: str
    role: str = "User"
    status: str = "verified"


class CurrentUserResponse(BaseModel):
    user_id: str
    email: str
    full_name: str
    role: str
    status: str
    is_hr_ops: bool
    allowed_groups: list[str]

