# One-Click Deployment Guide

**Audience:** FDE cohort participants deploying their own instance of DSS Ask Policy.
**Time:** ~10 minutes · **Cost:** $0 (free tiers) · **ML knowledge required:** none

---

## What you get

Your own private instance on your own Render account:

| Service | What it is |
|---|---|
| `dss-ask-policy-web` | The employee portal + HR Ops console (Next.js) |
| `ask-policy-api` | The RAG backend (FastAPI) |
| `ask-policy-db` | Your own PostgreSQL 16 + pgvector database |

**Works with zero external accounts.** Without any keys the app runs in **demo mode**: schema, the 14-policy library, RBAC, permission denials, escalation flows, execution traces, and the eval harness all function. AI answers need your own Azure OpenAI key (optional, below).

---

## Step 1 — Fork the repository

Fork [the repo](https://github.com/DeccansoftAITeam/dss-logistics-hr-app) to your own GitHub account (top-right **Fork** button). You deploy from your fork so you own the code.

## Step 2 — Click the Deploy button

In your fork, click the button in the README:

> [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

Or go to https://dashboard.render.com/blueprints and point it at your fork. **Sign in with your own Render account** (free) — the services will be created under your account.

## Step 3 — Fill in the deploy form

Render reads `render.yaml` and prompts for the `sync: false` values. What to enter:

| Variable | Required? | What to put |
|---|---|---|
| `ADMIN_BOOTSTRAP_EMAIL` | **Yes** | **Your** email — the first sign-in with it becomes a verified Admin automatically |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` / `CLERK_ORG_ID` / `CLERK_JWKS_URL` | Yes (auth) | See Step 4 |
| `AZURE_OPENAI_ENDPOINT` / `AZURE_OPENAI_API_KEY` | Optional | Your own Azure OpenAI resource → enables live AI answers |
| `AZURE_OPENAI_CHAT_DEPLOYMENT` / `AZURE_OPENAI_EMBEDDING_DEPLOYMENT` | Optional | Defaults `gpt-5.6-luna` / `text-embedding-3-large` (adjust to your deployments) |
| `AZURE_STORAGE_CONNECTION_STRING` | Optional | Leave blank in demo mode |
| `JIRA_*` | Optional | Leave blank — escalations fall back to synthetic ticket keys |

## Step 4 — Get Clerk keys (~3 minutes, free)

The app uses Clerk for sign-in. This is the one external service that must exist.

1. Create a free account at https://dashboard.clerk.com → **Create application**
2. Choose **Google** (and/or email code) as the sign-in method — matches the demo
3. After creation, copy from **API Keys**:
   - `Publishable key` → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `Secret key` → `CLERK_SECRET_KEY`
4. Create an **Organization** named anything (e.g. `DSS Logistics`) and copy its **Org ID** (`org_...`) → `CLERK_ORG_ID`
5. **JWKS URL**: on the same API Keys page, your instance's domain is shown (e.g. `https://your-app-56.clerk.accounts.dev`). Set `CLERK_JWKS_URL` to `https://<your-instance>.clerks.accounts.dev/.well-known/jwks.json`

> Note: the current build reads identity from the session and DB profile — the JWKS URL is used by the API for future signature verification. Setting it is required by the blueprint but signature enforcement is a known open item (see TID §14.2).

## Step 5 — First boot (automatic)

When Render finishes deploying, the API performs a **one-time bootstrap**:

1. Detects the empty database → creates the schema (incl. `pgvector`) and runs migrations
2. Ingests all **14 policies** and **36 gold eval cases** (with placeholder embeddings if no Azure key — keyword search still works)
3. Marks the work done; subsequent restarts skip it

Watch it in the Render logs for `ask-policy-api` — look for `Empty database detected - running one-time bootstrap...` then `Bootstrap complete`.

## Step 6 — Become the admin

1. Open your web URL → sign in **with the email you set as `ADMIN_BOOTSTRAP_EMAIL`**
2. You are auto-promoted to **verified Admin** on first sign-in — the Ops Console is unlocked, and you can approve other users from **User Approvals**

---

## Enabling AI answers later (optional)

1. Azure Portal → create an **Azure OpenAI resource** → deploy `gpt-4o-mini` (or any chat model) and `text-embedding-3-large`
2. Render Dashboard → `ask-policy-api` → **Environment** → set `AZURE_OPENAI_ENDPOINT` + `AZURE_OPENAI_API_KEY` (+ deployment names if different)
3. Trigger ingestion: Render Shell or a one-off job:
   ```bash
   curl -X POST "https://<your-api>.onrender.com/admin/ingest" -H "x-clerk-user-email: <your-admin-email>"
   ```
4. Ask a policy question — live answers work

---

## Free-tier lifespan

Render free databases expire after 30 days and free services sleep after 15 min idle (first request then takes ~50 s). For a cohort that presents for 2–3 weeks, either upgrade the database ($7/mo) or plan to re-click the deploy button — the bootstrap re-creates everything in ~4 minutes.

## Teardown

Delete the Blueprint from the Render dashboard — web, API and database are all removed together. Nothing persists outside your account.