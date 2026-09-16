"""
Pydantic schemas for the Chat feature.
"""

from typing import Literal
from uuid import UUID
from pydantic import BaseModel, Field


class AskRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    conversation_id: UUID | None = None


class CitationItem(BaseModel):
    chunk_id: UUID
    doc_id: str
    title: str
    section_heading: str | None = None
    version_label: str
    snippet: str


class AskResponse(BaseModel):
    conversation_id: UUID
    message_id: UUID
    answer: str
    citations: list[CitationItem] = []
    outcome: Literal["answered", "declined", "escalated", "redirected"]
    escalation_token: str | None = None
    escalation_summary: str | None = None
    latency_ms: int
