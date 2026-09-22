# 06 — Deploy With One Click

**What you'll learn:** click one button, fill one form, and watch Render build your entire stack — website, API, and database.

**Before this step:** your completed worksheet from [doc 04](04-get-your-secret-keys.md) and your fork from [doc 05](05-fork-the-repository.md).

**Time:** ~30–45 minutes, mostly waiting.

> 🖥️ **Open TWO tabs in your browser:** Tab A = this guide. Tab B = your fork on GitHub. You'll switch between them.

---

## What you're about to do (so nothing surprises you)

The repository contains a **Render Blueprint** — a file named `render.yaml` that describes the complete system: a website, an API server, and a PostgreSQL database, all wired together. When you click the deploy button, Render:

1. Reads that file
2. Shows you a **form** asking for the secrets (your keys from doc 04)
3. Creates all three services **in your Render account**
4. Builds and starts them

Then, on **first boot**, the API does a one-time **bootstrap**: it notices its database is empty, creates all the tables, loads the **14 policy documents** and **36 evaluation cases**, and marks itself done. You'll see this in the logs.

---

## Step 1 — Click the deploy button

1. Go to **your fork** on GitHub: `github.com/YOUR-USERNAME/dss-logistics-hr-app`
2. On the fork's **home page**, scroll down — below the description you'll see a button image: **"Deploy to Render"**
   *(Screenshot to add: fork page with the Deploy to Render button visible)*
3. Click it

> 💡 If the button isn't obvious: it's an image link near the top of the README text.

4. Render opens and asks you to sign in → **use your own Render account** (doc 03). If it asks to connect your GitHub account, approve it.

---

## Step 2 — Fill the deploy form

Render reads the Blueprint and lists every secret it needs. This is where your **worksheet** (doc 04) pays off. Fill each field from the matching worksheet row:

| Form field | Worksheet row | What to paste |
|---|---|---|
| `ADMIN_BOOTSTRAP_EMAIL` | 1 | **Your email** — you'll sign in with this in doc 07 |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | 2 | `pk_test_...` |
| `CLERK_SECRET_KEY` | 3 | `sk_test_...` |
| `CLERK_ORG_ID` | 4 | `org_...` |
| `CLERK_JWKS_URL` | 5 | `https://....clerk.accounts.dev/.well-known/jwks.json` |
| `AZURE_OPENAI_ENDPOINT` | 6 | *Optional* — blank = demo mode |
| `AZURE_OPENAI_API_KEY` | 7 | *Optional* — blank = demo mode |
| `AZURE_OPENAI_CHAT_DEPLOYMENT` | 8 | *Optional* |
| `AZURE_OPENAI_EMBEDDING_DEPLOYMENT` | 9 | *Optional* |
| `AZURE_STORAGE_CONNECTION_STRING` | 10 | *Optional* — leave blank |
| `JIRA_*` fields | 11 | *Optional* — leave blank |

> ⚠️ **The #1 mistake in the whole course:** typing a *different* email in `ADMIN_BOOTSTRAP_EMAIL` than the Google account you'll sign in with. The first sign-in with that exact email becomes the admin. Double-check row 1.

> 💡 Don't see Azure/Jira fields? Render sometimes hides fields left blank in the Blueprint. Blank = optional = fine.

3. Double-check every field, then click **Apply** (or **Deploy Blueprint**)

---

## Step 3 — Watch the builds (the fun part)

Render now creates **three services**. You'll see them appear on your dashboard:

| Service | What it is | Build time |
|---|---|---|
| `dss-ask-policy-web` | the website | ~5–10 min |
| `ask-policy-api` | the brain (Python) | ~5 min |
| `ask-policy-db` | the database | ~2–5 min |

Each service shows a spinning **"Building…"** status. Click any service to watch its **Logs** — a live feed of the build.

**What "building" means:** Render is downloading your code, installing its dependencies (like installing Python packages or JavaScript libraries), and preparing it to run. First builds are slow; later ones are faster.

### What you should see in the API logs (after ~5–10 min)

When `ask-policy-api` starts, look for lines like:

```
Empty database detected - running one-time bootstrap...
Alembic migrations applied.
Bootstrap complete (corpus_queryable=True).
```

> 🔍 `corpus_queryable=True` means the 14 policies loaded **with embeddings** (your Azure key worked). If it says `corpus_queryable=False` or mentions demo mode: your app still works — retrieval just uses keyword search until you add the key (doc 09). Nothing is broken.

**✅ Check yourself (all three):**
- [ ] `ask-policy-db` shows **Available**
- [ ] `ask-policy-api` shows **Live** (green dot)
- [ ] `dss-ask-policy-web` shows **Live** (green dot)

---

## Step 4 — Open your app 🎉

1. Click on `dss-ask-policy-web` in your Render dashboard
2. At the top, find your **URL** — something like `https://dss-ask-policy-web-xxxx.onrender.com` (the suffix keeps your instance unique)
3. Click it. Your app loads.

> 🐢 **First load takes ~50 seconds** with a spinning "waking up" state. This is the free tier's sleep feature: after 15 idle minutes Render pauses your service; the next visitor wakes it. It's normal and it happens again after every idle period. (Doc 09 explains your options if this annoys you.)

You should see the **DSS Ask Policy** home page — the same one from doc 01's screenshots, but it's *yours*.

---

## If something goes wrong

- **A service shows "Deploy failed"** → open the service → **Logs** tab, scroll to the bottom. The last red lines say why. The most common cause is a typo in a form field (e.g. missing part of a key). Fix: Render dashboard → service → **Environment** → correct the value → save (it redeploys automatically).
- **Web is Live but the page errors** → check `ask-policy-api` logs. If you see Azure 401 errors, your Azure key/endpoint is wrong — doc 10 has the fix. (The rest of the app still works in the meantime.)
- **Clerk redirect error on the site** (`redirect_uri` mismatch) → your Clerk keys belong to a different Clerk app than the one you configured. Re-copy rows 2–5 from the worksheet and update the Environment tab of the **web** service.
- **"Bootstrap complete" never appears** → the API is waiting for the database. Check `ask-policy-db` is **Available** and restart the API (⋯ menu → **Restart**).

---

*Next: [07 — First login, become admin](07-first-login-become-admin.md)*