---
name: fullstack-render-web-setup
description: >
  Scaffold a new full-stack project tailored for Render deployment and modern web:
  Python/FastAPI + async SQLAlchemy 2.0 + Alembic + Render Managed PostgreSQL backend,
  React / Next.js web frontend in an Nx + pnpm monorepo, with ArchUnitPython architecture
  standardization (layer boundaries, cycle detection, 1000-line limits), 80% test-coverage gate,
  RFC 7807 error contract, and Render Blueprint (render.yaml). Use when starting a new full-stack
  web project targeting Render or when asked to scaffold a FastAPI + Web application with
  ArchUnitPython architectural guardrails.
---

# Full-Stack Render Web Setup

This skill scaffolds production-grade full-stack web applications tailored for Render deployment, featuring Python/FastAPI backend and React/Next.js frontend, standardized with **ArchUnitPython** for backend architecture enforcement and **Nx** for frontend module boundaries.

## Locked Architecture

1. **Target Infrastructure:** Render.com
   - Web service for frontend (Next.js / Node).
   - Web service for API (FastAPI / Python 3.12).
   - Render Managed PostgreSQL (supports `pgvector` and `pgcrypto`).
   - Any extensions unsupported on Render (`age`, `pgrouting`, `azure_ai`) are avoided; graph traversal is executed using recursive SQL CTEs.
   - Database connection string automatically adapts `postgres://` to `postgresql+asyncpg://`.
2. **Platform Scope:** Web Only (No React Native)
   - Clean focus on browser applications (employee portals, ops consoles).
   - No Expo, Metro, NativeWind, or dual-env mobile overhead.
3. **Architecture Standardization:** ArchUnitPython
   - Python backend enforces architecture in `backend/tests/test_architecture.py` via `archunitpython`:
     - **Cycle Prevention:** `project_files("app/").should().have_no_cycles()`
     - **Layer Boundaries:** `app.core` must never depend on `app.features`.
     - **File Size Metric:** `metrics("app/").count().lines_of_code().should_be_below(1000)` directly in pytest.
4. **Code Sharing & Monorepo:**
   - Managed via Nx and pnpm workspaces (`apps/web`, `packages/core`, `packages/hooks`, `packages/env`).
   - FastAPI backend maintains its own tooling (`uv`/`poetry`/`pip`) outside the JS graph.
5. **Quality & Coverage Gate:**
   - 80% line + branch test coverage gate repo-wide.
   - Vitest for web and shared packages; Pytest for backend.
6. **Error Contract:** RFC 7807 Problem Details (`application/problem+json`).

## Scaffolding Steps

1. **Collect Project Parameters:**
   - Project name / slug (e.g. `dss-ask-policy`).
   - Database name (e.g. `ask_policy_db`).
   - Domain feature slice name (e.g. `policies`, `conversations`).
2. **Copy Templates:**
   - Copy `templates/root/*` into the project root.
   - Copy `templates/backend/*` into `backend/`.
   - Copy `templates/apps/web/*` into `apps/web/`.
   - Copy `templates/packages/*` into `packages/`.
3. **Replace Placeholders:**
   - `{{PROJECT_NAME}}`, `{{PROJECT_SLUG}}`, `{{DB_NAME}}`.
4. **Install & Verify:**
   - Run `pnpm install` in the workspace root.
   - Set up Python virtual environment in `backend/` and install `pyproject.toml` dependencies including `archunitpython`.
   - Execute test suites (`pnpm test` and `pytest`) to verify tests and architecture rules pass cleanly.
5. **Render Deployment:**
   - `render.yaml` is pre-configured to provision web, api, and database services in one blueprint.
