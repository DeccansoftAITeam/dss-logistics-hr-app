# 03 — Create Your Free Accounts

**What you'll learn:** sign up for the three required cloud accounts, and decide about the two optional ones.

**Before this step:** an email address, a web browser, and (for Google sign-in) a Google account.

**Software to install:** **none.**

> 💡 Use the **same email** for all accounts if you can. It keeps things simple. If you plan to become your app's admin automatically, remember which email you'll use — doc 06 will ask for it as `ADMIN_BOOTSTRAP_EMAIL`.

---

## Accounts overview

| # | Service | Required? | Cost | Why |
|---|---|---|---|---|
| 1 | **GitHub** | ✅ Required | Free | Holds the code; you'll make your own copy (fork) |
| 2 | **Render** | ✅ Required | Free | Hosts the website, API and database |
| 3 | **Clerk** | ✅ Required | Free | Powers Google sign-in |
| 4 | **Azure OpenAI** | ⬜ Optional | Free credits | Makes the AI actually write answers |
| 5 | **Jira** | ⬜ Optional | Free | Escalations create real tickets |

---

## 1. GitHub (required)

GitHub is a website that stores code. A **repository** ("repo") is one project's folder of code. You'll create a free account, then in doc 05 make your **fork** (your own copy) of this project.

1. Go to **[github.com](https://github.com)**
2. Click **Sign up** (top-right)
3. Enter your email, create a password, pick a username
4. Solve the little puzzle, then verify your email (check your inbox for a code)

**✅ Check yourself:** you can log in at github.com and see your profile picture top-right.

> 💡 If you already have a GitHub account, use it. No need for a new one.

---

## 2. Render (required)

Render is the cloud platform that will **host** (run) your website, API and database — all on the free tier.

1. Go to **[render.com](https://render.com)** and click **Get Started**
2. **Sign up with GitHub** (easiest — one click, and it connects the two accounts, which you need later anyway)
3. If asked about your role or what you're building, pick anything sensible — e.g. *"Hobby / learning"*. Skip anything about billing (nothing here needs a credit card)

**✅ Check yourself:** you land on the **Render Dashboard** (dashboard.render.com) and it says something like "Welcome to Render".

> ⚠️ **Important:** when you later click the deploy button, you must be signed in to Render with **your own** account — not your instructor's. Your whole instance (services + database) will live under your account.

---

## 3. Clerk (required)

Clerk provides the **Google sign-in** for your app.

1. Go to **[dashboard.clerk.com](https://dashboard.clerk.com)** and click **Sign up**
2. Sign up with Google or email
3. Once inside, click **Create application**
4. Name it anything, e.g. **`DSS Ask Policy`**
5. Under sign-in options, turn on **Google** (that's what this app uses). You can add "Email code" too if you like
6. Click **Create application**

**✅ Check yourself:** you're on your new application's page and see a section called **API Keys**.

### 3b. Create an Organization

The app checks that users belong to a company organization.

1. In the Clerk sidebar, click **Organizations**
2. Click **Create organization**
3. Name it anything, e.g. **`DSS Logistics`**
4. After it's created, open it and find its **ID** — it looks like `org_3JOvLRFnE0PQixivSXSmJC5Gcdt`
5. **Copy it** — you'll need it in doc 04

**✅ Check yourself:** your organization exists and you've copied its `org_...` ID somewhere safe.

---

## 4. Azure OpenAI (optional — read this before deciding)

This is the component that makes the AI write real answers. Without it, your app runs in **demo mode** (everything works except AI-written answers — and you can add the key later in 5 minutes, doc 09).

**Skip this now if:** you're short on time, or your instructor said the cohort runs in demo mode. Go straight to doc 05.

**Do this now if:** you want live AI answers from day one. You need an Azure account (Microsoft's cloud):

1. Go to **[portal.azure.com](https://portal.azure.com)** and sign in / create a free account (free tier includes credits; you may need a card for identity verification, but you won't be charged for a small demo)
2. In the portal, search for **Azure OpenAI** and create a resource (your instructor can give you the exact settings, or follow Microsoft's guide)
3. Once created, open the resource → **Keys and Endpoint** → copy **Key 1** and the **Endpoint** URL
4. Deploy a **chat model** (e.g. `gpt-4o-mini` or your instructor's suggested deployment name) and the **embedding model** `text-embedding-3-large` — in the resource's **Model deployments** area

> 💡 This is genuinely the fiddliest step of the whole journey. If it slows you down: skip it, deploy in demo mode, and come back later (doc 09). Don't let this block you.

---

## 5. Jira (optional)

Escalations work without Jira (they produce a synthetic ticket key). Only set up Jira if your instructor asks you to. Instructions are in the admin guide (`docs/setup-and-services-guide.md`) — not needed for the beginner track.

---

## ✅ Check yourself

- [ ] You can log into **GitHub**
- [ ] You can log into **Render** (dashboard.render.com) using GitHub sign-in
- [ ] You have a **Clerk application** with Google sign-in enabled
- [ ] You have a **Clerk organization** and copied its `org_...` ID
- [ ] You decided: Azure now, or demo mode first?

---

## If something goes wrong

- **Clerk "Create application" is greyed out** → you may not have verified your email yet. Check your inbox.
- **Render asks for a credit card** → you clicked a paid tier. Go back and choose the **free** plan later in the deploy form; the deploy button flow never needs a card.
- **Azure is overwhelming** → skip it. Demo mode. Doc 09 adds it later.

---

*Next: [04 — Get your secret keys](04-get-your-secret-keys.md)*