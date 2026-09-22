# 07 — First Login & Become Admin

**What you'll learn:** sign in for the first time, become the verified Admin automatically, and unlock the Ops Console.

**Before this step:** your app is **Live** ([doc 06](06-deploy-with-one-click.md)) and you know your `ADMIN_BOOTSTRAP_EMAIL` (worksheet row 1 from doc 04).

---

## How becoming admin works

There is no password for the admin account and no hidden button. The rule is:

> **The first person who signs in with the exact email you put in `ADMIN_BOOTSTRAP_EMAIL` is automatically promoted to a verified Admin.**

That's why doc 04 made you choose the email carefully. If you set it to your Google account's email, this step takes 30 seconds.

---

## Step 1 — Sign in

1. Open **your app URL** (the one from doc 06, Step 4)
2. Click **Sign in** (top-right)
3. Choose **Google** and pick the account whose email matches `ADMIN_BOOTSTRAP_EMAIL`
4. Approve the Clerk popup

**What happens under the hood (nice to know):** Clerk verifies you with Google and hands your app a signed token; the app then checks its database for your profile, sees your email matches the bootstrap email, and promotes you. Nobody clicks "approve" for you — you are patient zero of your own instance.

**✅ Check yourself:**
- [ ] You're signed in — your name/picture appears in the header
- [ ] You see an **Ops Console** link (admins only) in the navigation

If the Ops Console link is missing → you signed in with a different email than row 1. Sign out, sign in with the right one. (If you used a completely different email by mistake, doc 09 shows how to change `ADMIN_BOOTSTRAP_EMAIL` on the API service, then sign in once with that email.)

---

## Step 2 — Meet the Ops Console

Click **Ops Console**. This is the back office from doc 01 — five tabs:

| Tab | What it shows |
|---|---|
| **Overview** | Live stats: conversations, answers, escalations, users |
| **Conversations & Traces** | Every chat, and the full step-by-step trace of every request |
| **Policy Library** | The 14 documents, their versions, audiences, categories |
| **Quality Gates** | Run the 36 gold test cases and see the score |
| **User Approvals** | Approve / reject / promote users |

*(Screenshot to add: Ops Console overview with the five tabs visible)*

### The single most impressive screen: a trace

Go to **Conversations**, open any conversation, click **View trace**. You'll see ~8 spans:

```
auth → permission_filter → retrieval → graph_expand → model_call → citation_check → outcome
```

Each span shows what the system *actually did*: which audience groups you have, which documents were retrieved, whether a conflict was checked, how long the model took. This is the "show your work" feature of the whole system — every AI decision is auditable.

*(Screenshot to add: an expanded trace with spans)*

---

## Step 3 — Approve your other users (if you have any)

Your classmates/colleagues can sign in to *your* app with their Google accounts. Until you approve them, they sit in `pending_approval` and can browse but not chat.

1. Ops Console → **User Approvals**
2. Find the user → click **Approve** (or promote them to **HR**)

*(Screenshot to add: User Approvals with pending users)*

---

## ✅ Check yourself

- [ ] Signed in with the admin email
- [ ] Ops Console visible and opens
- [ ] You found a trace with ~8 spans
- [ ] You can see the Policy Library with 14 documents

---

## If something goes wrong

- **"Pending approval" banner won't go away** → the backend couldn't confirm your profile (usually the backend is asleep). Wait ~60s, refresh once.
- **Ops Console says "Access denied"** → your DB profile didn't get the admin promotion — it only happens on *first* sign-in. Doc 09: change `ADMIN_BOOTSTRAP_EMAIL` to match the account you *actually* signed in with, restart the API, sign in again.
- **Everything else broken** → [10 — Troubleshooting](10-troubleshooting.md).

---

*Next: [08 — Take your app for a spin](08-take-your-app-for-a-spin.md)*