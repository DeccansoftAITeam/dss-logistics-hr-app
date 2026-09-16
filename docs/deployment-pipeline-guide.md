# Full-Stack Deployment Pipeline & Infrastructure Guide

**Application:** DSS Logistics — Ask Policy Chatbot & Enterprise HR Ops Console  
**Repository:** [https://github.com/DeccansoftAITeam/dss-logistics-hr-app](https://github.com/DeccansoftAITeam/dss-logistics-hr-app)  
**Status:** Deployed & Live in Production  
**Last Updated:** September 2026  

---

## 1. Architecture & Live Endpoints Overview

The DSS Logistics Ask Policy platform is an enterprise-grade AI system deployed across cloud services with automated Continuous Delivery (CD) triggered by git commits to the `main` branch.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   GitHub Repository                                    │
│                     DeccansoftAITeam/dss-logistics-hr-app (main)                       │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │ (Webhook on Git Push)
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                Render Cloud Platform                                   │
│                                                                                        │
│   ┌────────────────────────────────┐         ┌─────────────────────────────────────┐   │
│   │   Frontend: dss-ask-policy-web │         │     Backend: ask-policy-api         │   │
│   │   Next.js 14 (App Router)      │         │     FastAPI + SQLAlchemy 2.0        │   │
│   │   Node.js 20+ Runtime          ├────────►│     Python 3.12+ Runtime            │   │
│   │   Port: Dynamic $PORT          │ (Proxy) │     Port: Dynamic $PORT             │   │
│   └───────────────┬────────────────┘         └──────────────┬──────────────────────┘   │
│                   │                                         │                          │
│                   │                                         ▼                          │
│                   │                          ┌─────────────────────────────────────┐   │
│                   │                          │      Postgres: ask-policy-db        │   │
│                   │                          │   Render Managed PostgreSQL 16      │   │
│                   │                          │   pgvector (1536 dims) + pgcrypto   │   │
│                   │                          └─────────────────────────────────────┘   │
└───────────────────┼─────────────────────────────────────────┼──────────────────────────┘
                    │                                         │
                    ▼                                         ▼
         ┌─────────────────────┐                   ┌────────────────────────┐
         │     Clerk Auth      │                   │   External Services    │
         │  Session Tokens     │                   │  • Azure OpenAI (Luna) │
         │  RBAC Permissions   │                   │  • Azure Blob Storage  │
         │  Org Memberships    │                   │  • Jira Cloud (HRSD)   │
         └─────────────────────┘                   └────────────────────────┘
```

### Live Production Endpoints

| Resource | Service ID | Environment | Primary URL | Health Check / Validation |
| :--- | :--- | :---: | :--- | :--- |
| **Web Frontend** | `srv-dal93aijnfac73csudqg` | Production | [https://dss-ask-policy-web.onrender.com](https://dss-ask-policy-web.onrender.com) | HTTP 200 on `/` |
| **Backend API** | `srv-dal91m5bedkc73bmn270` | Production | [https://ask-policy-api.onrender.com](https://ask-policy-api.onrender.com) | [GET /healthz](https://ask-policy-api.onrender.com/healthz) |
| **Database** | `dpg-dal4nt5g1s2s73e88ph0-a` | Production | Managed Postgres (Internal Connection String) | `SELECT 1;` & pgvector extension |

---

## 2. Monorepo Repository Structure

The project is structured as a pnpm monorepo uniting the Next.js frontend, FastAPI backend, Alembic migrations, evaluation datasets, and infrastructure specifications:

```
dss-logistics-hr-app/
├── .github/                       # CI workflows and automation
├── apps/
│   └── web/                       # Next.js 14 App Router Frontend
│       ├── src/
│       │   ├── app/               # Routes: /, /ops, /sign-in, /sign-up, /api/*
│       │   ├── components/        # Header, FloatingChatbot, UI components
│       │   ├── context/           # UserContext, PersonaContext
│       │   ├── lib/               # backend.ts (Dynamic URL resolution)
│       │   └── middleware.ts      # Clerk edge middleware
│       ├── package.json           # Frontend dependencies (Tailwind, Clerk, Lucide)
│       ├── postcss.config.js
│       ├── tailwind.config.js
│       └── tsconfig.json          # TypeScript baseUrl & paths
├── backend/                       # Python / FastAPI Backend
│       ├── app/
│       │   ├── core/              # Config, Auth (Clerk JWKS), Database session
│       │   ├── db/                # Base models, engine factory
│       │   ├── features/          # chat, policies, admin, audit, models
│       │   └── main.py            # FastAPI entry point & CORS
│       ├── migrations/            # Alembic async migration scripts
│       │   └── versions/
│       ├── alembic.ini
│       ├── pyproject.toml         # Python packaging & dependencies
│       └── setup.py
├── corpus/                        # 11 statutory markdown policy documents
├── docs/                          # Architecture guides & webinar slide decks
├── eval/                          # Synthetic ground-truth Q&A evaluation sets
├── package.json                   # Root monorepo scripts & workspaces
├── pnpm-lock.yaml                 # Pinned monorepo dependency lockfile
├── pnpm-workspace.yaml            # Monorepo workspace definition
└── render.yaml                    # Infrastructure as Code (Render Blueprint)
```

---

## 3. Infrastructure as Code: `render.yaml`

The Render Blueprint declarative file defines all services, connection strings, build commands, and service linkages:

```yaml
services:
  - type: web
    name: dss-ask-policy-web
    runtime: node
    plan: free
    buildCommand: pnpm install --prod=false --no-frozen-lockfile && pnpm build
    startCommand: pnpm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
        sync: false
      - key: CLERK_SECRET_KEY
        sync: false
      - key: NEXT_PUBLIC_API_BASE_URL
        value: https://ask-policy-api.onrender.com
      - key: INTERNAL_BACKEND_URL
        value: https://ask-policy-api.onrender.com

  - type: web
    name: ask-policy-api
    runtime: python
    plan: free
    rootDir: backend
    buildCommand: pip install -e .
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: APP_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: ask-policy-db
          property: connectionString
      - key: AZURE_OPENAI_ENDPOINT
        value: https://suresh-azurefoundry-research.openai.azure.com/
      - key: AZURE_OPENAI_API_KEY
        sync: false
      - key: AZURE_OPENAI_CHAT_DEPLOYMENT
        value: gpt-5.6-luna
      - key: AZURE_OPENAI_EMBEDDING_DEPLOYMENT
        value: text-embedding-3-large
      - key: AZURE_STORAGE_CONNECTION_STRING
        sync: false
      - key: AZURE_STORAGE_CONTAINER
        value: dss-ask-policy-content
      - key: CLERK_JWKS_URL
        value: https://sensible-skylark-9101.clerk.accounts.dev/.well-known/jwks.json
      - key: CLERK_ORG_ID
        value: org_3JOvLRFnE0PQixivSXSmJC5Gcdt
      - key: JIRA_SITE_URL
        value: https://fde-dss-logistics.atlassian.net
      - key: JIRA_PROJECT_KEY
        value: HRSD
      - key: JIRA_EMAIL
        sync: false
      - key: JIRA_API_TOKEN
        sync: false

databases:
  - name: ask-policy-db
    plan: free
    databaseName: ask_policy
    user: ask_policy_user
```

---

## 4. Build & Deployment Execution Pipeline

When a commit is pushed to the `main` branch of `DeccansoftAITeam/dss-logistics-hr-app`, Render triggers simultaneous build pipelines:

### 4.1 Backend Build & Release Flow
1. **Clone & Checkout:** Clones latest commit from GitHub into `/opt/render/project/src`.
2. **Virtual Environment:** Automatically activates Python runtime (`Python 3.12+`).
3. **Dependency Resolution:**
   ```bash
   pip install -e .
   ```
4. **Container Boot & Health Check:**
   - Runs `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
   - Dynamically parses `$PORT` allocated by Render (e.g. `10000`).
   - Replaces `postgres://` or `postgresql://` connection strings with `postgresql+asyncpg://` and verifies database connectivity.
5. **Switch Traffic:** On successful port binding, sets status to `live`.

### 4.2 Web Frontend Build & Release Flow
1. **Clone & Checkout:** Clones latest commit from GitHub into `/opt/render/project/src`.
2. **Node Environment:** Selects Node.js (`>=20.0.0`).
3. **Workspace Dependency Installation:**
   ```bash
   pnpm install --prod=false --no-frozen-lockfile
   ```
   * `--prod=false`: Ensures build tools (`tailwindcss`, `postcss`, `autoprefixer`, `typescript`) are installed even under `NODE_ENV=production`.
   * `--no-frozen-lockfile`: Allows resilient CI builds across environment differences.
4. **Next.js Production Compilation:**
   ```bash
   pnpm build
   # Runs: pnpm --filter web build -> next build
   ```
   * Bundles React Server Components, client chunks, and compiles Tailwind CSS.
   * Generates route manifests and middleware chunks.
5. **Start Command:**
   ```bash
   pnpm start
   # Runs: next start (listening on 0.0.0.0:$PORT)
   ```
6. **Switch Traffic:** On successful port binding, sets status to `live`.

---

## 5. Environment Variables & Secret Configuration

The following secrets and environment variables must be populated on Render:

### Web Service (`dss-ask-policy-web`)

| Variable Key | Description | Example / Production Value |
| :--- | :--- | :--- |
| `NODE_ENV` | Node execution environment | `production` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key for client auth | `pk_test_c2Vuc2lib...` |
| `CLERK_SECRET_KEY` | Clerk server-side secret API key | `sk_test_CBnxtF1...` |
| `NEXT_PUBLIC_API_BASE_URL` | Public URL of the FastAPI backend | `https://ask-policy-api.onrender.com` |
| `INTERNAL_BACKEND_URL` | Server-side proxy destination URL | `https://ask-policy-api.onrender.com` |

### Backend API (`ask-policy-api`)

| Variable Key | Description | Example / Production Value |
| :--- | :--- | :--- |
| `APP_ENV` | Application environment flag | `production` |
| `DATABASE_URL` | Async PostgreSQL connection string | Linked via Render Database (`fromDatabase`) |
| `AZURE_OPENAI_ENDPOINT` | Azure Foundry OpenAI endpoint | `https://suresh-azurefoundry-research.openai.azure.com/` |
| `AZURE_OPENAI_API_KEY` | Azure Foundry OpenAI API key | *Confidential* |
| `AZURE_OPENAI_CHAT_DEPLOYMENT`| Model deployment name | `gpt-5.6-luna` |
| `AZURE_OPENAI_EMBEDDING_DEPLOYMENT` | Embedding model deployment | `text-embedding-3-large` |
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Blob Storage access string | *Confidential* |
| `AZURE_STORAGE_CONTAINER` | Azure Blob container name | `dss-ask-policy-content` |
| `CLERK_JWKS_URL` | Clerk JWKS for JWT signature verification | `https://sensible-skylark-9101.clerk.accounts.dev/.well-known/jwks.json` |
| `CLERK_ORG_ID` | Organization ID for DSS Logistics | `org_3JOvLRFnE0PQixivSXSmJC5Gcdt` |
| `JIRA_SITE_URL` | Atlassian Cloud instance URL | `https://fde-dss-logistics.atlassian.net` |
| `JIRA_PROJECT_KEY` | Jira service desk project key | `HRSD` |
| `JIRA_EMAIL` | Service account email for Jira API | `iamsureshkarri@gmail.com` |
| `JIRA_API_TOKEN` | Atlassian API Token | *Confidential* |

---

## 6. Critical Deployment Gotchas & Solutions Applied

During the initial deployment to Render, several real-world container and monorepo challenges were identified and solved:

### 1. Read-Only File System Error with Corepack
* **Problem:** Running `corepack enable` failed with:
  `Internal Error: EROFS: read-only file system, unlink '/usr/bin/pnpm'`.
* **Root Cause:** Render's secure container environment locks down `/usr/bin` as read-only.
* **Solution:** Removed `corepack enable` and ran `pnpm install` directly, leveraging Render's native pnpm detection from `package.json`'s `packageManager` field.

### 2. Global Service Name Collision
* **Problem:** Creating web service `ask-policy-web` returned:
  `Error 400: name: (ask-policy-web) already in use`.
* **Root Cause:** Render web service names generate global subdomains (`<name>.onrender.com`) and must be globally unique across all Render accounts.
* **Solution:** Renamed the frontend service to `dss-ask-policy-web` (`https://dss-ask-policy-web.onrender.com`).

### 3. Missing `tailwindcss` Loader in Production
* **Problem:** Next.js build failed with:
  `Cannot find module 'tailwindcss'` during `./src/app/globals.css` compilation.
* **Root Cause:** In `NODE_ENV=production`, `pnpm install` skips `devDependencies` by default. `tailwindcss`, `postcss`, and `autoprefixer` were originally in `devDependencies`.
* **Solution:** Moved build-essential dependencies (`tailwindcss`, `postcss`, `autoprefixer`, `typescript`, `@types/*`) into `dependencies` in `apps/web/package.json` and added `--prod=false` to the install command.

### 4. CI Frozen Lockfile Mismatches
* **Problem:** Build failed with `ERR_PNPM_OUTDATED_LOCKFILE`.
* **Root Cause:** Render runs `pnpm install` with `--frozen-lockfile` by default in CI environments.
* **Solution:** Synchronized `pnpm-lock.yaml` locally, committed to git, and configured `--no-frozen-lockfile` in the build command.

### 5. Linux Case-Sensitivity & Alias Resolution
* **Problem:** Next.js webpack threw `Module not found: Can't resolve '@/context/UserContext'`.
* **Root Cause:** Missing `"baseUrl": "."` in `apps/web/tsconfig.json` caused Next.js on Linux containers to fail alias resolution.
* **Solution:** Added `"baseUrl": "."` and dual paths (`src/*`, `./src/*`) in `tsconfig.json`, and standardized component imports to exact relative paths (`../context/UserContext`).

### 6. Dynamic Backend Proxy Resolution
* **Problem:** Next.js API routes defaulted `BACKEND_URL` to `http://127.0.0.1:8000`, causing 502 Bad Gateway errors on Render where web and API run in isolated containers.
* **Solution:** Created `apps/web/src/lib/backend.ts` with auto-protocol prefixing (`https://`) and fallback to `INTERNAL_BACKEND_URL` / `NEXT_PUBLIC_API_BASE_URL` (`https://ask-policy-api.onrender.com`).

---

## 7. Render Free Tier Lifecycle & Sleep Behavior

* **Idle Spin-Down:** After 15 minutes with no incoming HTTP traffic, Render spins down free web service containers to conserve capacity.
* **Automatic Cold-Start:** When any user visits `https://dss-ask-policy-web.onrender.com`, Render detects incoming HTTP traffic and automatically starts the container (~30–45s).
* **Cascading Backend Wakeup:** When the frontend page loads and requests `/api/policies` or chat prompts, Next.js calls `https://ask-policy-api.onrender.com`, automatically triggering the backend's cold start.
* **Always-On Upgrade (Optional):**
  * Upgrading `ask-policy-api` to the **Starter Plan ($7/month)** eliminates backend cold starts completely, ensuring 24/7 instant response times.

---

## 8. CLI Deployment & Operations Cheat Sheet

To inspect, monitor, or trigger deployments using the Render CLI from your workstation:

```powershell
# 1. View deployed services
render services list

# 2. View live build or application logs
render logs --resources srv-dal93aijnfac73csudqg --tail

# 3. Trigger manual deployment for Web
render deploys create srv-dal93aijnfac73csudqg

# 4. Trigger manual deployment for API
render deploys create srv-dal91m5bedkc73bmn270

# 5. Validate blueprint schema
render blueprints validate ./render.yaml
```
