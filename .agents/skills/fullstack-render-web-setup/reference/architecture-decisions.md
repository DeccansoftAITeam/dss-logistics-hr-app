# Architecture Decisions — Full Rationale

This document is the source of truth for the architectural decisions behind `fullstack-render-web-setup`.

## 1. Target Deployment Platform: Render.com

- **Web Service (Frontend):** Next.js / Node.js web service running on Render.
- **API Service (Backend):** Python 3.12 / FastAPI web service on Render, managed via Uvicorn.
- **Database:** Render Managed PostgreSQL.
  - Supported extensions: `pgcrypto` and `pgvector` (`vector`).
  - Unsupported on Render: `azure_ai`, `age` (Apache AGE), `pgrouting`. Per project constraints, any features requiring these unsupported extensions are avoided or handled via standard relational CTEs and client-side graph traversal.
  - Connection string format: Render exposes `DATABASE_URL` as `postgres://` or `postgresql://`. The application automatically normalizes this to `postgresql+asyncpg://` for SQLAlchemy 2.0 AsyncEngine.
- **Render Blueprint:** `render.yaml` defines the full multi-service topology for zero-friction deployment.

## 2. Platform Scope: Web-Only (No React Native)

- **Rationale:** The project is dedicated to web-based desktop and responsive browser experiences (e.g. employee chat portal and HR Ops console).
- **Eliminated Complexity:** Removed Expo, React Native, Metro bundler, NativeWind, Babel mobile configs, and mobile-specific dual-env prefixes (`EXPO_PUBLIC_*`).
- **Shared Code:** Pure business logic, types, and API contracts remain separated cleanly into `packages/core` and `packages/hooks`, consumed directly by `apps/web`.

## 3. Architecture Standardization: ArchUnitPython

- **Problem it solves:** In Python backends, architecture rules often degrade over time due to missing mechanical enforcement. Developers or AI agents may introduce circular imports, leak feature logic into core modules, or write 2000-line monolithic files.
- **Decision:** Use **ArchUnitPython** (`archunitpython`) integrated into `pytest` (`backend/tests/test_architecture.py`).
- **Enforced Rules:**
  1. **Zero Cycles:** `project_files("app/").should().have_no_cycles()`.
  2. **Layer Boundaries:** `app.core` must never depend on domain feature slices in `app.features`.
  3. **File Length Limit:** `metrics("app/").count().lines_of_code().should_be_below(1000)` enforces the 1000-line rule as an automated test assertion.
  4. **Architecture Visualization:** Can export dependency graphs to Mermaid (`reports/dependency-graph.mmd`) or interactive HTML reports during CI.
- **Benefit over ad-hoc scripts:** ArchUnit tests run as standard pytest test cases, producing structured assertion diagnostics and blocking CI and pre-push hooks natively.

## 4. Error Contract: RFC 7807 Problem Details

- All backend errors (validation, HTTP errors, 500s) return `application/problem+json` standard format.
- Handled centrally in `app/core/errors.py`.

## 5. Async Database Stack: SQLAlchemy 2.0 + Alembic

- Uses `create_async_engine` with `asyncpg`.
- Alembic uses the official async template.
- Hard rule: always explicit `selectinload` or `joinedload` on relationships to prevent `MissingGreenlet` exceptions at runtime.

## 6. Coverage Gate: 80% Repo-Wide

- Enforced locally via pre-push hooks (`nx affected -t test --coverage` and `pytest --cov --cov-fail-under=80`).
- Non-bypassable CI gate in GitHub Actions.
