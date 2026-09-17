# DSS Ask Policy — FDE Case Study

A **permission-aware enterprise policy assistant** built as the capstone artifact of a Forward Deployed AI Engineer (FDE) case study: an employee chat portal with mandatory citations, deterministic must-escalate rules, an approval-gated helpdesk integration, and an HR Operations console with per-request execution traces and a release quality gate.

> **Teaching artifact · fictional client (DSS Logistics Pvt Ltd) · synthetic corpus.** Every policy document, user, and adoption figure is synthetic.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

**Deploying your own instance?** → Read [`DEPLOY.md`](DEPLOY.md). Ten minutes, free tier, no ML knowledge required. The app boots in demo mode without any external keys and provisions its own database, policy library and evaluation set on first boot.

---

## What it demonstrates

| Capability | Where to see it |
|---|---|
| Permission-aware RAG (audience filter enforced **in SQL**, not by the model) | Ask a question as different roles |
| Mandatory citations + current-version guard (`is_current`) | Every factual answer; ask about sick leave — it cites v3.0, never superseded v2.0 |
| Regional precedence (India / US addenda) | Same question, different persona |
| Deterministic must-escalate (legal, disciplinary, medical, separation) | "Should I accept this severance package?" |
| Approval-gated escalation → real Jira ticket (or synthetic key without creds) | Confirm the escalation draft in chat |
| Restricted-content probe (data-driven; no hardcoded document IDs) | Ask about the disciplinary procedure as a regular employee |
| Data-driven conflict gate (topical only) | Ask about the Mumbai per-diem |
| Execution traces: 8 spans per request | Ops Console → Conversations & Traces |
| Quality gate over a 36-case gold set (dev/holdout split) | Ops Console → Quality Gates |
| RFC 7807 errors, ArchUnit architecture tests, 33-test suite | `backend/tests/` |

## Repository layout

```
apps/web        Next.js 14 (App Router) portal + Ops console (Clerk auth)
backend/        FastAPI service: retrieval, generation, eval, ops APIs
corpus/         14 synthetic policy documents (Markdown + YAML front matter)
eval/           gold_cases.json — 36 hand-written evaluation cases
scripts/        ingestion + user seeding
docs/           plans, guides, deliverable artifacts (PRD, TID, executive deck)
render.yaml     Render Blueprint (one-click deploy)
DEPLOY.md       participant deployment guide
```

## Local development

```bash
pnpm install                 # install web dependencies
# backend (Python 3.12):
cd backend
python -m venv .venv && .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -e .
uvicorn app.main:app --port 8000
# web:
pnpm --filter web dev        # http://localhost:3000
```

Copy `.env.example` (see below) or configure environment variables as documented in [`DEPLOY.md`](DEPLOY.md).

## Deliverable artifacts

`docs/artifacts/` contains the engagement deliverables: **PRD**, **Technical Implementation Document**, **Executive Presentation** (PPTX/PDF), and the screenshot library. The PRD (§12) and TID (§14) carry honest registers of known gaps and how each was found and fixed.

## Tests

```bash
cd backend && python -m pytest          # 33 tests: API, architecture, eval scoring
pnpm --filter web build                 # frontend build check
```

---

*Built as a Forward Deployed AI Engineer case study: one fictional engagement, from ambiguous ask to shipped, evaluated, handed-over system.*