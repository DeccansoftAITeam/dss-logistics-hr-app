# 04 — Get Your Secret Keys

**What you'll learn:** collect every key the deploy form will ask for, and fill in the worksheet at the bottom. Do not skip the worksheet — doc 06 will ask you to paste these exact values.

**Before this step:** accounts from [doc 03](03-create-your-free-accounts.md).

> 🔑 **What's a "key"?** A long random string that proves to a service that the request came from you. Keys are **secrets**: never paste them into chat, email, or public websites. It's fine to paste them into the Render deploy form — that's what it's for.

---

## The worksheet — fill it in as you go

Copy this table into a notepad file (or print it) and fill each row **now**, as you do the step.

| # | Variable name | Your value | Where you got it |
|---|---|---|---|
| 1 | `ADMIN_BOOTSTRAP_EMAIL` | ______________________ | **You decide** — your email (see Step 1) |
| 2 | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ______________________ | Clerk → API Keys (Step 2) |
| 3 | `CLERK_SECRET_KEY` | ______________________ | Clerk → API Keys (Step 2) |
| 4 | `CLERK_ORG_ID` | ______________________ | Clerk → Organizations (Step 3) |
| 5 | `CLERK_JWKS_URL` | ______________________ | Clerk → API Keys (Step 4) |
| 6 | `AZURE_OPENAI_ENDPOINT` | ______________________ | *Optional* Azure → Keys & Endpoint (Step 5) |
| 7 | `AZURE_OPENAI_API_KEY` | ______________________ | *Optional* Azure → Keys & Endpoint (Step 5) |
| 8 | `AZURE_OPENAI_CHAT_DEPLOYMENT` | ______________________ | *Optional* your chat model name (Step 5) |
| 9 | `AZURE_OPENAI_EMBEDDING_DEPLOYMENT` | ______________________ | *Optional* usually `text-embedding-3-large` |
| 10 | `AZURE_STORAGE_CONNECTION_STRING` | ______________________ | *Optional* — can stay blank (demo mode) |
| 11 | `JIRA_*` | ______________________ | *Optional* — can stay blank |

> ✍️ Variables 6–11 are all optional. A full row of blanks there = demo mode. That's a valid choice.

---

## Step 1 — Decide your admin email

The **first person to sign in** with this email automatically becomes a verified **Admin** (full back-office access, ability to approve other users).

- Use **your own email** — the same Google account you'll use to sign in later (doc 07).
- Write it in worksheet row 1. Done.

> ⚠️ This is the single most commonly botched field in the deploy form. If you sign in later with a different email, you won't be an admin. Decide now, remember it.

---

## Step 2 — Clerk publishable & secret keys

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com) and open **your application**
2. In the left sidebar, click **API Keys**
3. You'll see two values:
   - **Publishable key** — starts with `pk_test_...` → copy to worksheet row 2
   - **Secret key** — starts with `sk_test_...`; click to reveal → copy to worksheet row 3

> 💡 Why two keys? The **publishable** key is public (it's in the browser). The **secret** key must stay secret (it lives on the server, in Render's env vars). The deploy form handles where each one goes — just paste the right string into the right field.

---

## Step 3 — Clerk Organization ID

1. Sidebar → **Organizations**
2. Click your organization (e.g. *DSS Logistics*)
3. Copy the **Organization ID** starting with `org_` → worksheet row 4

*(If you skipped this in doc 03: sidebar → Organizations → Create organization, name it anything.)*

---

## Step 4 — Clerk JWKS URL

The JWKS URL is where your app will later verify the *signatures* on login tokens.

1. Back to **API Keys** in the Clerk sidebar
2. Find your instance's domain — it looks like `https://your-app-56.clerk.accounts.dev` (shown near your keys)
3. Your JWKS URL is that domain **plus** `/.well-known/jwks.json`:

```
https://your-app-56.clerk.accounts.dev/.well-known/jwks.json
```

4. Copy your version → worksheet row 5

> ℹ️ Honest note: the current build reads your identity from the Clerk session and its own database; this URL is used by the API for signature verification. The deploy form requires it, so fill it in — it takes 10 seconds.

---

## Step 5 — Azure OpenAI keys (optional)

**Skip this step if you chose demo mode.** Leave rows 6–9 blank and move on.

If you created your Azure OpenAI resource in doc 03:

1. Open [portal.azure.com](https://portal.azure.com) → your **Azure OpenAI resource**
2. Left menu → **Keys and Endpoint**:
   - Copy the **Endpoint** (looks like `https://yourname.openai.azure.com/`) → row 6
   - Copy **Key 1** → row 7
3. Left menu → **Model deployments** (or **Deployments**):
   - Find your **chat** model's **deployment name** → row 8 (note: the *deployment name* you gave it, which may differ from the model name)
   - Find your **embedding** deployment name → row 9. If you deployed `text-embedding-3-large`, use that name

> ⚠️ The deployment name is what you *named* the deployment in Azure — check it, don't guess it. A wrong name = the app can't find the model.

---

## Step 6 — Final check

Before moving on, verify your worksheet:

- [ ] Row 1: a real email you can sign in with (this becomes your admin!)
- [ ] Rows 2–3: keys starting with `pk_test_` and `sk_test_`
- [ ] Row 4: starts with `org_`
- [ ] Row 5: ends with `/.well-known/jwks.json`
- [ ] Rows 6–9: filled (going live now) or consciously blank (demo mode)

**Save this worksheet.** The next docs assume you have it open.

---

## If something goes wrong

- **Clerk API Keys page shows only one key** → make sure you're inside your *application* (not the dashboard home). Both keys are always listed together.
- **No organization ID visible** → you haven't created the organization. Doc 03 §3b.
- **Lost the worksheet** → redo Steps 2–4; it takes 3 minutes. Keys can be re-copied any time from Clerk's dashboard.

---

*Next: [05 — Fork the repository](05-fork-the-repository.md)*