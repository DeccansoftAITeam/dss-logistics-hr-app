# 10 — Troubleshooting

**What you'll learn:** a method for diagnosing any problem, plus fixes for every error this app has actually produced in real deployments.

**Before this step:** anything broken. Start here.

---

## The 4-step diagnosis method

1. **Which service is unhappy?** Web (`dss-ask-policy-web`), API (`ask-policy-api`), or DB (`ask-policy-db`)? A 500 error in chat → almost always the API.
2. **Open the Logs tab of that service** in the Render dashboard and scroll to the bottom. Red lines = your answer, 90% of the time.
3. **Match the error** against the list below.
4. **Fix, save, wait for the auto-redeploy** (2–4 min), retry.

> 🐢 A "sleeping" service mimics an outage: the first request after 15 idle minutes hangs ~50 s, then everything is fine. Rule #1: **refresh once after ~60 s** before diagnosing anything.

---

## The errors, from most to least common

### 1. Chat returns `500 Internal Server Error` on `/api/ask`

**Symptom:** the browser console shows `POST .../api/ask 500`, chat shows a failure message.
**Almost always:** an **Azure OpenAI authentication failure**. Open `ask-policy-api` logs — if you see:

```
openai.AuthenticationError: Error code: 401 - Access denied due to invalid
subscription key or wrong API endpoint...
```

then the API's Azure credentials are wrong. (The frontend's 500 is just *forwarding* the backend's failure — the browser error points at `/api/ask` but the real crime scene is the API.)

**Fix:**
1. Azure Portal → your OpenAI resource → **Keys and Endpoint** → fresh **Key 1** and endpoint
2. Render → `ask-policy-api` → **Environment** → update `AZURE_OPENAI_API_KEY` (and `AZURE_OPENAI_ENDPOINT` if it changed)
3. Save → auto-redeploy → ask a question again

**Notes:**
- The deployment **names** matter too: `AZURE_OPENAI_CHAT_DEPLOYMENT` / `AZURE_OPENAI_EMBEDDING_DEPLOYMENT` must match exactly what you named the deployments in Azure.
- After changing credentials, run **Re-ingest** (Ops Console) so stored chunks get embeddings.
- Recent builds include **graceful degradation**: an invalid key no longer 500s — you get keyword-only retrieval and a synthesis-failure notice instead. If you see the graceful behavior instead of a 500, it's still this same root cause.

### 2. The site hangs ~50 s, then loads

**Not an error.** Free-tier cold start (doc 09 §6). If it happens *every* request (not just after idle), check that the service is **Live** and not restarting in a loop.

### 3. "Pending approval" that never clears / can't sign in

- Your user profile lives in the DB; the sign-in lives in Clerk. The web app syncs them on load.
- If the backend is asleep or the DB is gone, the banner persists. Wake it (refresh after ~60 s).
- DB expired/recreated? All profiles reset — sign in again, have the admin re-approve you ([doc 09 §5](09-operate-your-deployment.md#5-the-free-database-expires-after-30-days--what-to-do)).

### 4. Deploy failed (a service stuck in "Deploy failed")

Open the service → **Logs** → last red lines.

| Log says | Fix |
|---|---|
| `Cannot find module 'tailwindcss'` (or similar) | A broken build cache or partial dependency install → service → **Manual Deploy** → **"Clear build cache & deploy"** |
| `EROFS: read-only file system, unlink '/usr/bin/pnpm'` | The build command tried to modify global pnpm — shouldn't happen with the current Blueprint; if it does, **Clear build cache & deploy** |
| Python package install fails | Redeploy once; if persistent, check your fork is up to date with the original (**Sync fork**) |

### 5. Clerk errors / redirect loops on sign-in

`redirect_uri` mismatch or "invalid api key":
- Your `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` come from **different Clerk applications**, or were truncated when pasted.
- Fix: Clerk → your app → API Keys → copy both keys fresh → web service **Environment** → replace both → save.
- Also confirm `CLERK_ORG_ID` belongs to the **same** Clerk app.

### 6. Answers work but citations are missing / retrieval is weak

- Check `ask-policy-api` logs at boot: `Bootstrap complete (corpus_queryable=...)`. `False` means chunks have no embeddings (demo mode or ingest without a key). Add the Azure key and re-ingest (doc 09 §4).
- Completely empty retrieval: the bootstrap may have never run (DB replaced?). Restart the API and watch for `Empty database detected - running one-time bootstrap...`.

### 7. `ask-policy-db` shows "Expired" or API can't connect

The free DB reached 30 days. Full walkthrough in doc 09 §5 (recreate free DB → update `DATABASE_URL` → bootstrap rebuilds everything).

### 8. Ops Console "Access denied" although you're admin

The admin promotion happens on **first sign-in with the bootstrap email**. If you first signed in with a different email:
1. API service → **Environment** → set `ADMIN_BOOTSTRAP_EMAIL` to the email you *actually* sign in with
2. Save → redeploy → sign out, sign in again

### 9. Escalations produce a synthetic ticket (e.g. `HRSD-...`-looking key) instead of a Jira ticket

Expected without Jira credentials. To go live: API **Environment** → set `JIRA_SITE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_PROJECT_KEY` → save.

---

## The Render CLI (optional, for the brave)

If you want command-line superpowers:

```powershell
# install: https://github.com/render-oss/cli/releases (Windows: download zip, add to PATH)
render login                      # browser-based login
render services                   # list your services
render logs --resources <service-id> --tail   # live logs
render restart --help             # restart a service
```

Service IDs look like `srv-xxxxxxxx...` — shown in the dashboard URL of a service. Everything the dashboard does, the CLI does; but the dashboard is always enough.

---

## Still stuck?

1. Check whether the [original repo's issues](https://github.com/DeccansoftAITeam/dss-logistics-hr-app/issues) describe your problem
2. Ask your instructor with: the service name, the exact red log lines, and what you clicked

---

*Next: [11 — Glossary](11-glossary.md)*