# 09 — Operate Your Deployment

**What you'll learn:** everyday care of your instance: reading logs, changing settings, updating code, adding Azure later, and surviving the free-tier database expiry.

**Before this step:** a working deployment ([docs 06–07](06-deploy-with-one-click.md)).

---

## 1. The Render dashboard — your cockpit

Log into [dashboard.render.com](https://dashboard.render.com). Your three services each have:

| Tab | What it's for |
|---|---|
| **Events** | Deploy history — what happened and when |
| **Logs** | Live output of your service (the first place to look when anything misbehaves) |
| **Environment** | All environment variables (your keys live here) |
| **Settings** | Commands, plan, auto-deploy |

> 💡 Bookmark your dashboard. That's mission control.

## 2. How code updates reach your app

**Automatic:** any commit pushed to your fork's `main` branch triggers a redeploy of the affected service. Nothing to click — this is **continuous deployment**.

**What that means for you:** if the original project publishes a fix and you want it:

1. Go to **your fork** on GitHub
2. Click **Sync fork** → **Update branch** (this pulls the original's latest changes into your copy)
3. Render notices the new commits and redeploys automatically

## 3. Changing environment variables

Example: fixing a mistyped Clerk key.

1. Dashboard → service (`dss-ask-policy-web` or `ask-policy-api`)
2. **Environment** tab → edit the value → **Save**
3. Render **redeploys automatically** — every env-var change restarts the service (~2–4 min)

> ⚠️ Env vars on the **web** service affect the website; on the **API** service affect the brain. When in doubt which one a variable belongs to: Clerk keys → web; Azure/DB/Jira → API; the Blueprint wires most other things for you.

## 4. Adding Azure OpenAI *later* (escaping demo mode)

Deployed without a key and want AI answers now? No redeploy from GitHub needed — just env vars:

1. Azure Portal → your OpenAI resource → **Keys and Endpoint** → copy Key 1 + endpoint
2. Render → `ask-policy-api` → **Environment**:
   - `AZURE_OPENAI_ENDPOINT` = your endpoint
   - `AZURE_OPENAI_API_KEY` = Key 1
   - `AZURE_OPENAI_CHAT_DEPLOYMENT` / `AZURE_OPENAI_EMBEDDING_DEPLOYMENT` = your deployment names
3. Save → the API redeploys
4. **Re-ingest the corpus** so the stored policy chunks get real embeddings. Two ways:
   - Ops Console → Policy Library → **Re-ingest** button (admin), or
   - Shell: `curl -X POST "https://YOUR-API-URL.onrender.com/admin/ingest" -H "x-clerk-user-email: YOUR-ADMIN-EMAIL"`

> ℹ️ Query-time embeddings are computed per question, so once the key is in and the corpus re-ingested, live AI answers work. Your earlier demo-mode chats remain in history as they were.

## 5. The free database expires after 30 days — what to do

Render deletes free-tier databases after ~30 days. When yours expires, the API loses its data store and everything stops working (the site may render, but chat/policies/users are gone). Two clean options:

### Option A — Recreate a free DB (5 minutes, $0)

1. Render dashboard → **New +** → **Postgres** → same region as your services (`Oregon`), plan **Free**, name e.g. `ask-policy-db2`
2. When it's **Available**, open it → **Connections** → copy the **Internal Database URL**
3. Render → `ask-policy-api` → **Environment** → `DATABASE_URL` → paste the new URL → Save (redeploys)
4. Watch the API logs: it detects an **empty database** and runs the one-time bootstrap again — recreating schema + 14 policies + 36 eval cases in ~4 minutes
5. Users re-appear by signing in again (their profiles rebuild on first sign-in; you approve them again from the Ops Console)

> Honest tradeoff: the free DB keeps nothing across this recreation. Chat history, eval runs, and user profiles reset. For a 2–3 week cohort this is the intended path — the guide's bootstrap makes it cheap.

### Option B — Upgrade the database ($7/month)

Render dashboard → `ask-policy-db` → **Upgrade** → pick a paid plan. No data loss, no rebuild. Worth it only if you need continuity beyond a month.

## 6. Sleep and cold starts

Free web services **sleep after ~15 min idle**. The next visitor waits ~50 s. If you're demoing at a specific time:

- Open your app URL 2 minutes before the demo to wake it
- Or upgrade the service to a paid plan for always-on

## 7. Health checks you can run yourself

- Backend healthy? Open `https://YOUR-API-URL.onrender.com/healthz` → should show `{"status":"ok",...}`
- Frontend up? Load your web URL — the home page hero should render

---

*Next: [10 — Troubleshooting](10-troubleshooting.md) — for when any of this misbehaves*