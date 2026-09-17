"""
HR Ops console service layer.
Provides operational dashboards, request traces, policy library governance, and evaluation harness runs.
"""

import hashlib
import logging
import secrets
import time
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import delete, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import AuthenticatedUser, invalidate_user_cache
from app.core.errors import NotFoundError
from app.features.chat.schemas import AskRequest
from app.features.chat.service import ChatService
from app.features.models import (
    Conversation,
    Escalation,
    EvalCaseResult,
    EvalGoldCase,
    EvalRun,
    Message,
    MessageCitation,
    Policy,
    PolicyAudience,
    PolicyChunk,
    PolicyRelationship,
    PolicySection,
    PolicyVersion,
    RequestTrace,
    TraceSpan,
    UserProfile,
)
from app.features.ops.schemas import (
    ConversationSummary,
    OverviewStats,
    PolicyLibraryItem,
    QualityMetric,
)

logger = logging.getLogger(__name__)

_OVERVIEW_CACHE: tuple[OverviewStats, float] | None = None
_LIBRARY_CACHE: tuple[list[PolicyLibraryItem], float] | None = None


def invalidate_ops_cache():
    global _OVERVIEW_CACHE, _LIBRARY_CACHE
    _OVERVIEW_CACHE = None
    _LIBRARY_CACHE = None


# Canonical behaviour vocabulary for evaluation scoring.
#
# Gold cases declare the expectation in imperative form
# (answer | refuse | escalate | redirect), while the chat pipeline records the
# runtime outcome in past-tense form (answered | declined | escalated |
# redirected). Comparing the two directly marks semantically identical results
# as failures. Both sides are therefore normalised to a single canonical set
# before comparison, so scoring is independent of the label vocabulary.
_BEHAVIOR_ALIASES: dict[str, str] = {
    "answer": "answer",
    "answered": "answer",
    "refuse": "refuse",
    "refused": "refuse",
    "decline": "refuse",
    "declined": "refuse",
    "escalate": "escalate",
    "escalated": "escalate",
    "redirect": "redirect",
    "redirected": "redirect",
}


def canonical_behavior(value: str | None) -> str:
    """
    Map a gold-case expectation or a pipeline outcome to a canonical behaviour.

    Unknown values are returned lower-cased and stripped so that an unexpected
    vocabulary item still compares deterministically (and surfaces as a
    mismatch) rather than being silently coerced.
    """
    if not value:
        return ""
    normalised = value.strip().lower()
    return _BEHAVIOR_ALIASES.get(normalised, normalised)


class OpsService:
    @staticmethod
    async def get_overview(session: AsyncSession) -> OverviewStats:
        global _OVERVIEW_CACHE
        now = time.time()
        if _OVERVIEW_CACHE and (now - _OVERVIEW_CACHE[1] < 60):
            return _OVERVIEW_CACHE[0]

        total_conv = (await session.execute(select(func.count(Conversation.id)))).scalar() or 0
        total_msg = (await session.execute(select(func.count(Message.id)))).scalar() or 0
        total_esc = (await session.execute(select(func.count(Escalation.id)))).scalar() or 0
        conf_esc = (
            await session.execute(
                select(func.count(Escalation.id)).where(Escalation.status == "confirmed")
            )
        ).scalar() or 0

        # Latency metrics from traces
        lat_res = await session.execute(
            select(RequestTrace.latency_ms).order_by(RequestTrace.latency_ms.asc())
        )
        latencies = lat_res.scalars().all()
        p50 = 0
        p95 = 0
        if latencies:
            p50 = latencies[int(len(latencies) * 0.5)]
            p95 = latencies[min(int(len(latencies) * 0.95), len(latencies) - 1)]

        # Latest eval run
        latest_eval_res = await session.execute(
            select(EvalRun).order_by(EvalRun.started_at.desc()).limit(1)
        )
        latest_eval = latest_eval_res.scalars().first()

        pass_rate = None
        gate_res = None
        rel = "v1.0.0"
        if latest_eval:
            pass_rate = float(latest_eval.correctness_pct) if latest_eval.correctness_pct else None
            gate_res = latest_eval.gate_result
            rel = latest_eval.candidate_release

        stats = OverviewStats(
            total_conversations=total_conv,
            total_messages=total_msg,
            total_escalations=total_esc,
            confirmed_escalations=conf_esc,
            latency_p50_ms=p50,
            latency_p95_ms=p95,
            eval_pass_rate_pct=pass_rate,
            gate_result=gate_res,
            candidate_release=rel,
        )
        _OVERVIEW_CACHE = (stats, now)
        return stats

    @staticmethod
    async def get_conversations(session: AsyncSession, limit: int = 50) -> list[ConversationSummary]:
        res = await session.execute(
            select(Conversation)
            .options(selectinload(Conversation.messages))
            .order_by(Conversation.last_message_at.desc())
            .limit(limit)
        )
        convs = res.scalars().all()

        # Build lookup map for UserProfile by clerk_user_id and email
        up_res = await session.execute(select(UserProfile))
        user_profiles = up_res.scalars().all()
        user_map: dict[str, UserProfile] = {}
        for up in user_profiles:
            if up.clerk_user_id:
                user_map[up.clerk_user_id] = up
            user_map[up.email.lower()] = up

        summaries = []
        for c in convs:
            last_out = c.messages[-1].outcome if c.messages else None
            matched_user = user_map.get(c.clerk_user_id) or user_map.get(c.clerk_user_id.lower())
            user_email = matched_user.email if matched_user else (c.clerk_user_id if "@" in c.clerk_user_id else None)
            user_name = matched_user.full_name if matched_user else None

            summaries.append(
                ConversationSummary(
                    id=c.id,
                    user_id=c.clerk_user_id,
                    user_email=user_email,
                    user_name=user_name,
                    started_at=c.started_at,
                    last_message_at=c.last_message_at,
                    message_count=len(c.messages),
                    last_outcome=last_out,
                )
            )
        return summaries

    @staticmethod
    async def get_conversation_trace(session: AsyncSession, conversation_id: uuid.UUID) -> dict:
        conv_res = await session.execute(
            select(Conversation)
            .options(selectinload(Conversation.messages).selectinload(Message.citations))
            .where(Conversation.id == conversation_id)
        )
        conv = conv_res.scalars().first()
        if not conv:
            raise NotFoundError(title="Conversation not found")

        # Resolve the conversation owner's display identity from user_profiles
        # (matched on Clerk id, then email). Old rows may carry 'anonymous' as the
        # stored clerk id; email-domain matching covers those.
        up_res = await session.execute(select(UserProfile))
        user_profiles = up_res.scalars().all()
        user_map: dict[str, UserProfile] = {}
        for up in user_profiles:
            if up.clerk_user_id:
                user_map[up.clerk_user_id] = up
            user_map[up.email.lower()] = up
        matched_user = (
            user_map.get(conv.clerk_user_id)
            or user_map.get((conv.clerk_user_id or "").lower())
        )
        if matched_user is None and "@" in (conv.clerk_user_id or ""):
            res2 = await session.execute(
                select(UserProfile).where(UserProfile.email == conv.clerk_user_id.lower())
            )
            matched_user = res2.scalars().first()

        owner_email = matched_user.email if matched_user else None
        owner_name = matched_user.full_name if matched_user else None
        owner_display = (
            owner_name or owner_email or (
                conv.clerk_user_id if "@" in (conv.clerk_user_id or "") else conv.clerk_user_id
            )
        )

        traces_res = await session.execute(
            select(RequestTrace)
            .options(selectinload(RequestTrace.spans))
            .where(RequestTrace.conversation_id == conversation_id)
            .order_by(RequestTrace.created_at.asc())
        )
        traces = traces_res.scalars().all()

        return {
            "conversation_id": conv.id,
            "clerk_user_id": conv.clerk_user_id,
            "user_id": conv.clerk_user_id,
            "user_name": owner_name,
            "user_email": owner_email,
            "user_display": owner_display,
            "started_at": conv.started_at,
            "messages": [
                {
                    "id": m.id,
                    "role": m.role,
                    "content": m.content,
                    "outcome": m.outcome,
                    "latency_ms": m.latency_ms,
                    "created_at": m.created_at,
                    "citations_count": len(m.citations),
                }
                for m in conv.messages
            ],
            "traces": [
                {
                    "id": t.id,
                    "outcome": t.outcome,
                    "latency_ms": t.latency_ms,
                    "release_version": t.release_version,
                    "created_at": t.created_at,
                    "spans": [
                        {
                            "ordinal": s.ordinal,
                            "name": s.name,
                            "status": s.status,
                            "detail": s.detail,
                            "duration_ms": s.duration_ms,
                        }
                        for s in t.spans
                    ],
                }
                for t in traces
            ],
        }

    @staticmethod
    async def get_policy_library(session: AsyncSession) -> list[PolicyLibraryItem]:
        global _LIBRARY_CACHE
        now = time.time()
        if _LIBRARY_CACHE and (now - _LIBRARY_CACHE[1] < 120):
            return _LIBRARY_CACHE[0]

        res = await session.execute(
            select(Policy).options(
                selectinload(Policy.versions).selectinload(PolicyVersion.audiences)
            )
        )
        policies = res.scalars().all()

        # Relationships
        rels_res = await session.execute(select(PolicyRelationship))
        all_rels = rels_res.scalars().all()

        library_items = []
        for p in policies:
            # Look for current version first, fallback to first version
            curr_v = next((v for v in p.versions if v.is_current), None)
            if not curr_v and p.versions:
                curr_v = p.versions[0]
            if not curr_v:
                continue

            auds = [a.audience_group for a in curr_v.audiences]
            rels = [
                {
                    "related_version_id": str(r.related_policy_version_id),
                    "type": r.relationship_type,
                    "evidence": r.evidence,
                }
                for r in all_rels
                if r.policy_version_id == curr_v.id or r.related_policy_version_id == curr_v.id
            ]
            has_conf = any(r["type"] == "conflicts_with" for r in rels)

            library_items.append(
                PolicyLibraryItem(
                    id=p.id,
                    doc_id=p.doc_id,
                    title=p.title,
                    category=p.category,
                    region_scope=p.region_scope,
                    version_label=curr_v.version_label,
                    effective_date=str(curr_v.effective_date),
                    is_current=curr_v.is_current,
                    status=curr_v.status,
                    audiences=auds,
                    relationships=rels,
                    has_conflicts=has_conf,
                )
            )

        sorted_items = sorted(library_items, key=lambda x: x.doc_id)
        _LIBRARY_CACHE = (sorted_items, now)
        return sorted_items

    @staticmethod
    async def reclassify_policy(
        session: AsyncSession,
        doc_id: str,
        target_audiences: list[str],
    ) -> dict:
        """
        Simulate the Day 6 Incident resolution:
        Reclassify a policy (e.g. POL-HR-012 PIP Handbook) from all-employees to people-managers.
        """
        p_res = await session.execute(
            select(Policy).options(selectinload(Policy.versions)).where(Policy.doc_id == doc_id)
        )
        policy = p_res.scalars().first()
        if not policy:
            raise NotFoundError(title=f"Policy {doc_id} not found")

        curr_v = next((v for v in policy.versions if v.is_current), None)
        if not curr_v:
            raise NotFoundError(title=f"Current version for {doc_id} not found")

        # Delete existing audiences
        await session.execute(
            delete(PolicyAudience).where(PolicyAudience.policy_version_id == curr_v.id)
        )
        for aud in target_audiences:
            session.add(PolicyAudience(policy_version_id=curr_v.id, audience_group=aud))

        curr_v.synced_at = datetime.now(timezone.utc)
        await session.commit()
        invalidate_ops_cache()

        return {
            "doc_id": doc_id,
            "version": curr_v.version_label,
            "new_audiences": target_audiences,
            "message": f"Successfully reclassified {doc_id} to {target_audiences}",
        }

    @staticmethod
    async def get_quality_dashboard(session: AsyncSession) -> dict:
        runs_res = await session.execute(
            select(EvalRun).order_by(EvalRun.started_at.desc()).limit(10)
        )
        runs = runs_res.scalars().all()

        latest_run = runs[0] if runs else None
        cases_breakdown = []
        if latest_run:
            results_res = await session.execute(
                select(EvalCaseResult).where(EvalCaseResult.eval_run_id == latest_run.id)
            )
            case_results = results_res.scalars().all()
            cases_breakdown = [
                {
                    "gold_case_id": cr.gold_case_id,
                    "verdict": cr.verdict,
                    "retrieved_doc_ids": cr.retrieved_doc_ids,
                    "answer_preview": (cr.answer_text or "")[:150],
                    "notes": cr.notes,
                }
                for cr in case_results
            ]

        # All gold cases
        gold_res = await session.execute(select(EvalGoldCase))
        all_cases = gold_res.scalars().all()

        return {
            "total_gold_cases": len(all_cases),
            "dev_cases_count": sum(1 for c in all_cases if c.split == "dev"),
            "holdout_cases_count": sum(1 for c in all_cases if c.split == "holdout"),
            "latest_run": (
                QualityMetric(
                    run_label=latest_run.run_label,
                    candidate_release=latest_run.candidate_release,
                    correctness_pct=float(latest_run.correctness_pct or 0.0),
                    must_escalate_recall_pct=float(latest_run.must_escalate_recall_pct or 0.0),
                    unnecessary_escalation_pct=float(latest_run.unnecessary_escalation_pct or 0.0),
                    latency_p50_ms=latest_run.latency_p50_ms or 0,
                    latency_p95_ms=latest_run.latency_p95_ms or 0,
                    release_blockers_count=latest_run.release_blockers_count,
                    gate_result=latest_run.gate_result or "unknown",
                    completed_at=latest_run.completed_at,
                )
                if latest_run
                else None
            ),
            "recent_runs": [
                {
                    "run_label": r.run_label,
                    "candidate_release": r.candidate_release,
                    "correctness_pct": float(r.correctness_pct or 0.0),
                    "gate_result": r.gate_result,
                    "started_at": r.started_at,
                }
                for r in runs
            ],
            "case_results": cases_breakdown,
        }

    @staticmethod
    async def trigger_eval_run(session: AsyncSession, split_filter: str | None = "dev") -> EvalRun:
        """
        Execute evaluation harness against seeded eval_gold_cases.
        Grading rubric:
        - pass: behavior matches expected_behavior; if expected_citation_doc_id is present, it is cited/retrieved;
                must_not_retrieve_doc_ids are never retrieved.
        - fail: violation of security boundary, false escalation, or missed escalation.
        """
        chat_service = ChatService()

        query = select(EvalGoldCase)
        if split_filter:
            query = query.where(EvalGoldCase.split == split_filter)
        cases_res = await session.execute(query)
        cases = cases_res.scalars().all()

        run_id = uuid.uuid4()
        run_label = f"run_{secrets.token_hex(4)}"
        candidate_rel = "v1.0.0"
        started_at = datetime.now(timezone.utc)

        eval_run = EvalRun(
            id=run_id,
            run_label=run_label,
            candidate_release=candidate_rel,
            started_at=started_at,
            release_blockers_count=0,
        )
        session.add(eval_run)
        await session.flush()

        # Personas mapping
        persona_perms = {
            "Arjun Reddy": ["all-employees", "india-employees"],
            "Emily Chen": ["all-employees", "us-employees"],
            "Rahul Mehta": ["all-employees", "india-employees", "hr-managers", "org:role:hr-ops"],
            "Kavya Iyer": ["all-employees", "india-employees", "people-managers"],
        }

        latencies = []
        pass_count = 0
        must_escalate_total = 0
        must_escalate_success = 0
        unnecessary_esc_count = 0
        blockers = 0

        for c in cases:
            perms = persona_perms.get(c.persona, ["all-employees"])
            mock_user = AuthenticatedUser(
                user_id=f"eval_{c.persona.lower().replace(' ', '_')}",
                org_id="org_3JOvLRFnE0PQixivSXSmJC5Gcdt",
                permissions=perms,
                allowed_groups=perms,
                is_hr_ops="hr-managers" in perms or "org:role:hr-ops" in perms,
            )

            req = AskRequest(message=c.question)
            t0 = time.time()
            resp = await chat_service.process_ask(session=session, req=req, user=mock_user)
            t_dur = int((time.time() - t0) * 1000)
            latencies.append(t_dur)

            retrieved_ids = [cit.doc_id for cit in resp.citations]

            # Grading
            verdict = "pass"
            notes = []

            expected = canonical_behavior(c.expected_behavior)
            actual = canonical_behavior(resp.outcome)

            # Check must_not_retrieve_doc_ids
            forbidden_hit = set(retrieved_ids).intersection(set(c.must_not_retrieve_doc_ids))
            if forbidden_hit:
                verdict = "fail"
                blockers += 1
                notes.append(f"Security violation: retrieved forbidden docs {list(forbidden_hit)}")

            # Check expected_behavior (compare canonical behaviours, not raw labels)
            if expected != actual:
                verdict = "fail"
                notes.append(
                    f"Expected outcome '{expected}' but got '{actual}'"
                )

            # Check expected_citation
            if c.expected_citation_doc_id and verdict == "pass":
                if c.expected_citation_doc_id not in retrieved_ids and c.expected_citation_doc_id not in resp.answer:
                    verdict = "partial"
                    notes.append(f"Missing expected citation {c.expected_citation_doc_id}")

            # Escalation metric counters (canonical comparison for consistency)
            if expected == "escalate":
                must_escalate_total += 1
                if actual == "escalate":
                    must_escalate_success += 1
            elif actual == "escalate":
                unnecessary_esc_count += 1

            if verdict == "pass":
                pass_count += 1

            # Insert case result
            case_res = EvalCaseResult(
                eval_run_id=run_id,
                gold_case_id=c.id,
                retrieved_doc_ids=retrieved_ids,
                answer_text=resp.answer,
                verdict=verdict,
                notes="; ".join(notes) if notes else "Passed rubric criteria",
            )
            session.add(case_res)

        total_cases = len(cases) or 1
        latencies.sort()
        p50 = latencies[int(len(latencies) * 0.5)] if latencies else 0
        p95 = latencies[min(int(len(latencies) * 0.95), len(latencies) - 1)] if latencies else 0

        correctness = round((pass_count / total_cases) * 100.0, 2)
        esc_recall = (
            round((must_escalate_success / must_escalate_total) * 100.0, 2)
            if must_escalate_total > 0
            else 100.0
        )
        unnec_esc = round((unnecessary_esc_count / total_cases) * 100.0, 2)

        gate_result = "pass" if (correctness >= 80.0 and blockers == 0) else "fail"

        eval_run.completed_at = datetime.now(timezone.utc)
        eval_run.correctness_pct = correctness
        eval_run.must_escalate_recall_pct = esc_recall
        eval_run.unnecessary_escalation_pct = unnec_esc
        eval_run.latency_p50_ms = p50
        eval_run.latency_p95_ms = p95
        eval_run.release_blockers_count = blockers
        eval_run.gate_result = gate_result
        eval_run.report_sha = hashlib.sha256(f"{run_label}:{correctness}".encode()).hexdigest()

        await session.commit()
        await session.refresh(eval_run)
        invalidate_ops_cache()
        return eval_run

    @staticmethod
    async def get_users(session: AsyncSession) -> list[UserProfile]:
        res = await session.execute(select(UserProfile).order_by(UserProfile.created_at.desc()))
        return list(res.scalars().all())

    @staticmethod
    async def update_user_status(
        session: AsyncSession, user_id: uuid.UUID, status: str, role: str | None = None
    ) -> UserProfile:
        res = await session.execute(select(UserProfile).where(UserProfile.id == user_id))
        user = res.scalars().first()
        if not user:
            raise NotFoundError(title=f"User {user_id} not found")
        user.status = status
        if role:
            user.role = role
        await session.commit()
        await session.refresh(user)
        invalidate_user_cache(user.email)
        return user

    @staticmethod
    async def create_user(
        session: AsyncSession, email: str, full_name: str, role: str = "User", status: str = "verified"
    ) -> UserProfile:
        clean_email = email.lower().strip()
        res = await session.execute(select(UserProfile).where(UserProfile.email == clean_email))
        user = res.scalars().first()
        if user:
            user.full_name = full_name
            user.role = role
            user.status = status
        else:
            user = UserProfile(
                email=clean_email,
                full_name=full_name,
                role=role,
                status=status,
            )
            session.add(user)
        await session.commit()
        await session.refresh(user)
        invalidate_user_cache(clean_email)
        return user

