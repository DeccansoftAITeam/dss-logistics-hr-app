"""
FastAPI Router for Chat endpoints.
"""

import time
from typing import Any
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import AuthenticatedUser, get_current_user
from app.core.db import get_db
from app.core.errors import ForbiddenError, NotFoundError
from app.features.chat.schemas import AskRequest, AskResponse
from app.features.chat.service import ChatService
from app.features.models import (
    Conversation,
    Message,
    Policy,
    PolicyAudience,
    PolicySection,
    PolicyVersion,
)

router = APIRouter(prefix="", tags=["Chat"])
service = ChatService()


@router.post("/ask", response_model=AskResponse)
async def ask_policy(
    req: AskRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Main employee policy Q&A endpoint.
    Performs security-trimmed hybrid retrieval, recursive graph expansion,
    conflict detection, answer synthesis, and observability tracing.
    """
    return await service.process_ask(session=db, req=req, user=user)


@router.get("/conversations/{conversation_id}")
async def get_conversation_history(
    conversation_id: UUID,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve message history for an ongoing conversation."""
    res = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.clerk_user_id == user.user_id,
        )
    )
    conv = res.scalars().first()
    if not conv:
        raise NotFoundError(title="Conversation not found")

    m_res = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    )
    messages = m_res.scalars().all()

    return {
        "id": conv.id,
        "started_at": conv.started_at,
        "last_message_at": conv.last_message_at,
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "outcome": m.outcome,
                "latency_ms": m.latency_ms,
                "created_at": m.created_at,
            }
            for m in messages
        ],
    }


from sqlalchemy.orm import noload, selectinload

_policies_cache: dict[str, Any] = {"timestamp": 0.0, "data": []}
_policy_details_cache: dict[str, dict[str, Any]] = {}
CACHE_TTL_SECONDS = 600.0


@router.get("/policies")
async def list_policies(
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all published policies accessible to this employee based on audience permissions."""
    if user.status != "verified":
        return []

    now = time.time()
    if not _policies_cache["data"] or (now - _policies_cache["timestamp"] > CACHE_TTL_SECONDS):
        stmt = (
            select(PolicyVersion)
            .where(PolicyVersion.is_current == True)
            .options(
                selectinload(PolicyVersion.policy),
                selectinload(PolicyVersion.audiences),
                noload(PolicyVersion.sections),
            )
        )
        res = await db.execute(stmt)
        versions = res.scalars().all()

        cached_list = []
        for curr_v in versions:
            policy = curr_v.policy
            if not policy:
                continue
            audiences = [a.audience_group for a in curr_v.audiences]
            cached_list.append({
                "doc_id": policy.doc_id,
                "title": policy.title,
                "category": policy.category,
                "region_scope": policy.region_scope,
                "version_label": curr_v.version_label,
                "effective_date": str(curr_v.effective_date),
                "status": curr_v.status,
                "audiences": audiences,
                "summary": (curr_v.extracted_text or "")[:200].strip() if curr_v.extracted_text else "",
            })
        cached_list.sort(key=lambda p: p["doc_id"])
        _policies_cache["data"] = cached_list
        _policies_cache["timestamp"] = now

    policies_out = []
    user_groups = set(user.allowed_groups)
    for p in _policies_cache["data"]:
        audiences = p.get("audiences", [])
        if set(audiences).intersection(user_groups) or "all-employees" in audiences:
            policies_out.append(p)

    return policies_out


@router.get("/policies/{doc_id}")
async def get_policy_detail(
    doc_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve full document text and section hierarchy for a specific policy."""
    now = time.time()
    cached = _policy_details_cache.get(doc_id)
    if not cached or (now - cached.get("_cached_at", 0) > CACHE_TTL_SECONDS):
        stmt = (
            select(PolicyVersion)
            .join(Policy)
            .where(Policy.doc_id == doc_id, PolicyVersion.is_current == True)
            .options(
                selectinload(PolicyVersion.policy),
                selectinload(PolicyVersion.audiences),
                selectinload(PolicyVersion.sections),
            )
        )
        res = await db.execute(stmt)
        curr_v = res.scalars().first()
        if not curr_v:
            raise NotFoundError(title=f"Policy {doc_id} not found")

        policy = curr_v.policy
        audiences = [a.audience_group for a in curr_v.audiences]
        sections = sorted(curr_v.sections, key=lambda s: s.ordinal)

        cached = {
            "_cached_at": now,
            "doc_id": policy.doc_id,
            "title": policy.title,
            "category": policy.category,
            "region_scope": policy.region_scope,
            "version_label": curr_v.version_label,
            "effective_date": str(curr_v.effective_date),
            "status": curr_v.status,
            "audiences": audiences,
            "extracted_text": curr_v.extracted_text,
            "sections": [
                {
                    "ordinal": s.ordinal,
                    "heading_path": s.heading_path,
                    "text_content": s.text_content,
                }
                for s in sections
            ],
        }
        _policy_details_cache[doc_id] = cached

    audiences = cached.get("audiences", [])
    if not (set(audiences).intersection(set(user.allowed_groups)) or "all-employees" in audiences):
        raise ForbiddenError(
            title="Access Denied",
            detail="You do not have clearance to view this policy document.",
        )

    return {k: v for k, v in cached.items() if k != "_cached_at"}


