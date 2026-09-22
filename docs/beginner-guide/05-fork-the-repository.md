# 05 — Fork the Repository

**What you'll learn:** what a "fork" is, why you need your own, and how to make one in one click.

**Before this step:** a GitHub account ([doc 03](03-create-your-free-accounts.md)).

---

## What is forking?

A **repository** (or "repo") is a project's code folder stored on GitHub. The project lives at:

> **`github.com/DeccansoftAITeam/dss-logistics-hr-app`**

A **fork** is *your own copy* of that repository, created inside *your* GitHub account. Same code, same history, but **you own it**.

```
DeccansoftAITeam/dss-logistics-hr-app     ← the original (not yours)
        │  you click "Fork"
        ▼
yourname/dss-logistics-hr-app             ← YOUR copy (you own this)
```

## Why you can't just deploy the original

1. **Ownership.** When you deploy, Render connects to a repo and pulls code from *your* account. Deploying from the instructor's repo would tie your app to their account and their permissions.
2. **Control.** If you ever change the code (even just to experiment), that change goes to *your* copy — without asking anyone.
3. **Isolation.** Each participant having their own fork means each participant's deployment is fully independent — that's the whole point of this exercise.

> 💡 Forking is like a photocopy of a workbook: the original stays untouched, and you write in your copy.

---

## Steps

1. Make sure you're **logged into GitHub** ([github.com](https://github.com))
2. Open the project: **[github.com/DeccansoftAITeam/dss-logistics-hr-app](https://github.com/DeccansoftAITeam/dss-logistics-hr-app)**
3. Click the **Fork** button — top-right corner of the page
   *(Screenshot to add: the repo page with the Fork button circled)*
4. A "Create a new fork" page appears. **Change nothing.** Click **Create fork**
5. Wait ~10 seconds. GitHub redirects you to **your** copy

**✅ Check yourself:** the page title now says **`yourname / dss-logistics-hr-app`** (your GitHub username, not DeccansoftAITeam), and near the top it says *"forked from DeccansoftAITeam/dss-logistics-hr-app"*.

---

## Keep this URL — you'll use it in the next doc

Your fork's address is:

```
https://github.com/YOUR-USERNAME/dss-logistics-hr-app
```

The deploy button in doc 06 will automatically use your fork (you'll click it *from your fork's page*), so you mostly don't need to type this — but it's good to know where you are.

---

## If something goes wrong

- **"Fork" button missing** → you're not logged in. Log in and refresh.
- **"You already have a fork"** → great, you did this before. Use the existing one.
- **Accidentally edited a file in the original repo** → impossible; you don't have write access there. Any edit you made was in your fork — you can undo it.

---

*Next: [06 — Deploy with one click](06-deploy-with-one-click.md) — the main event*