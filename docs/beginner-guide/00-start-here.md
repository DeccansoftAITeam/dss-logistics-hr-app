# 00 — Start Here

**Welcome!** This guide teaches you everything you need to launch your own copy of the **DSS Ask Policy** application — even if you have never deployed software before.

**Total time:** about 2–3 hours (most of it is waiting for cloud services to build).
**Total cost:** $0. Everything runs on free tiers.
**Software to install on your computer:** **None.** You only need a web browser.

---

## What you will build

Your own private, fully working instance of an **AI policy assistant** for a fictional company called DSS Logistics. Employees ask questions like *"How many days of annual leave do I get?"* and the AI answers **using only the official policy documents**, always **citing its sources**, and always **respecting who is allowed to see what**.

By the end, you will have:

| What | Where it lives |
|---|---|
| A live website (the employee portal) | e.g. `https://dss-ask-policy-web.onrender.com` — **your own URL** |
| A live AI backend (the "brain") | e.g. `https://ask-policy-api.onrender.com` — **your own URL** |
| Your own database (policies, users, chat history) | Managed automatically for you |
| Your own login system (Google sign-in) | Via a free Clerk account |

Nobody else can see your instance. It runs in **your** cloud account, with **your** database, and **your** users.

---

## The journey (8 steps)

Follow these documents **in order**. Each one takes 5–30 minutes.

| # | Document | What you do | Time |
|---|---|---|---|
| 1 | [01 — What is this project?](01-what-is-this-project.md) | Understand the app and see it in pictures | 10 min |
| 2 | [02 — The components explained](02-the-components-explained.md) | Understand the 7 moving parts and why each exists | 15 min |
| 3 | [03 — Create your free accounts](03-create-your-free-accounts.md) | Sign up for GitHub, Render, Clerk (+ optional Azure) | 15 min |
| 4 | [04 — Get your secret keys](04-get-your-secret-keys.md) | Collect the keys the deploy form will ask for | 15 min |
| 5 | [05 — Fork the repository](05-fork-the-repository.md) | Make your own copy of the project's code | 5 min |
| 6 | [06 — Deploy with one click](06-deploy-with-one-click.md) | Click the Deploy button and watch it build | 30–45 min |
| 7 | [07 — First login, become admin](07-first-login-become-admin.md) | Sign in and unlock the Ops Console | 10 min |
| 8 | [08 — Take your app for a spin](08-take-your-app-for-a-spin.md) | A scripted demo that proves every feature works | 15 min |

**After the demo:**

| # | Document | When you need it |
|---|---|---|
| 9 | [09 — Operate your deployment](09-operate-your-deployment.md) | Day-to-day care: logs, updates, enabling AI answers later |
| 10 | [10 — Troubleshooting](10-troubleshooting.md) | Something broke — find and fix it |
| 11 | [11 — Glossary](11-glossary.md) | Any word you don't understand |

**Optional, for later:**

- [Appendix — Run the app on your own laptop](appendix-local-development.md) — for when you want to change the code locally. *This is the only place where installing software is required.*
- `facilitator-guide.md` — for the **instructor** running a live class (not for learners).

---

## The master checklist

Print this or keep it open. Tick items off as you go.

- [ ] Read doc 01 (what is this project?)
- [ ] Read doc 02 (the components)
- [ ] GitHub account created (doc 03)
- [ ] Render account created (doc 03)
- [ ] Clerk account + application + organization created (doc 03)
- [ ] Clerk keys collected: publishable key, secret key, org ID, JWKS URL (doc 04)
- [ ] *(Optional)* Azure OpenAI keys collected (doc 04)
- [ ] Fill-in worksheet in doc 04 completed — **do not lose this**
- [ ] Repository forked to your GitHub account (doc 05)
- [ ] Deploy button clicked, form filled with your keys (doc 06)
- [ ] All 3 services show **Live** in Render (doc 06)
- [ ] API bootstrap confirmed in logs: "Bootstrap complete" (doc 06)
- [ ] Signed in with your admin email (doc 07)
- [ ] Ops Console unlocked (doc 07)
- [ ] Demo tour completed: citations ✅ permission denial ✅ escalation ✅ traces ✅ (doc 08)

---

## Two honest warnings before you start

1. **Free cloud services "sleep."** If nobody opens your website for 15 minutes, Render pauses it to save money. The **first** person to open it after that waits **about 50 seconds** on a spinning loader. This is normal, not a bug. Refresh once and it's fast again.
2. **The free database lives 30 days.** Render deletes free databases after a month. Doc 09 explains exactly what to do when that happens (it takes ~5 minutes and your app rebuilds itself).

---

*Ready? Open [01 — What is this project?](01-what-is-this-project.md)*