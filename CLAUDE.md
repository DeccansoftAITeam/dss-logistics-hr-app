# DSS Ask Policy (DSS Logistics)

Teaching artifact · fictional client · synthetic corpus.

This project follows our locked architecture standard tailored for Render deployment and modern web applications. **Read this before writing any code.**

## Architecture & Layout

```
FDE-Case-study/
├── corpus/           # 14 synthetic policy documents in Markdown with YAML frontmatter
├── eval/             # 36 gold test cases (24 dev, 12 held-out)
├── apps/
│   └── web/          # Next.js App Router (15+) + Clerk + Tailwind CSS v4
├── backend/          # Python 3.12+ FastAPI service
│   ├── alembic/      # Async database migrations
│   ├── app/
│   │   ├── core/     # Database session, config, RFC 7807 errors, Clerk JWKS auth
│   │   ├── features/ # Domain feature vertical slices (policies, chat, escalations, ops)
│   │   └── main.py   # FastAPI entry point
│   └── tests/        # Pytest & ArchUnitPython architecture tests
├── packages/
│   ├── core/         # Shared TypeScript types, API client, Zod schemas
│   ├── hooks/        # React Query hooks & state orchestration
│   └── env/          # Validated client env schemas
└── render.yaml       # Render Blueprint for web service, api service, and managed DB
```

## Hard Rules

1. **Architecture standardization with ArchUnitPython:**
   - Architecture tests live in `backend/tests/test_architecture.py` and run during `pytest`.
   - **Zero cycles:** `project_files("app/").should().have_no_cycles()`.
   - **Layer boundaries:** `app/core` must never import from `app/features`.
   - **1000-line metric rule:** `metrics("app/").count().lines_of_code().should_be_below(1000)` enforced via pytest!
2. **Business logic never lives in presentation components:** Data transformations, validation, and API calls belong in `packages/core`, `packages/hooks`, or backend services.
3. **No file exceeds 1000 lines.** Enforced by ArchUnitPython for Python and ESLint `max-lines` for TS/JS.
4. **80% test coverage repo-wide is a hard gate.**
5. **Async SQLAlchemy 2.0:** Never rely on implicit lazy-loading. Always use explicit `selectinload` or `joinedload`.
6. **Error contract:** RFC 7807 Problem Details (`application/problem+json`) from `app/core/errors.py`.
7. **Permission enforcement:**
   - Every retrieval query strictly filters by `audience_group = ANY(:allowed_groups)`.
   - Clerk session permissions mapped to `allowed_groups` and cached server-side for **5 minutes**.
8. **Prompt Injection & Content Safety:**
   - System prompt explicitly instructs the LLM to ignore directive text found inside retrieved documents.
   - Citations must match actually retrieved chunks; hallucinations are declined.
9. **Escalations:**
   - Must-escalate checks run deterministically before generation for separation, legal, medical, and disciplinary inquiries.
   - Jira tickets are created only after explicit user confirmation in UI.
