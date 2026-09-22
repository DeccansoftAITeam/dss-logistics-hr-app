# 02 — The Components Explained

**What you'll learn:** every moving part of the system, what it does, why it exists, and what happens if you don't have it.

**Before this step:** you read [01 — What is this project?](01-what-is-this-project.md)

---

## The big picture

The app is **three programs + four cloud services**. Three of the programs run on **Render** (a cloud hosting company); the other services provide login, AI, file storage, and ticketing.

```
                         YOUR BROWSER
                              │
                              ▼
                ┌──────────────────────────┐
                │  1. WEB APP (Next.js)    │  ← the website you see
                │     on Render            │
                └────────────┬─────────────┘
                             │ talks privately to…
                             ▼
                ┌──────────────────────────┐
                │  2. API SERVER (FastAPI) │  ← the brain: search + AI + rules
                │     on Render            │
                └───────┬─────────┬────────┘
                        │         │
          reads/writes  │         │ asks the AI
                        ▼         ▼
        ┌──────────────────┐   ┌──────────────────┐
        │ 3. DATABASE      │   │ 4. AZURE OPENAI  │  ← the language model
        │ (PostgreSQL +    │   │   (optional)     │
        │  pgvector)       │   └──────────────────┘
        │ on Render        │
        └──────────────────┘
             ▲         ▲
    checks   │         │ stores files
   logins    │         │
        ┌────┴───┐  ┌──┴───────────┐   ┌──────────────┐
        │ CLERK  │  │ AZURE BLOB   │   │ JIRA CLOUD   │  ← tickets for escalations
        │        │  │ (optional)   │   │ (optional)   │
        └────────┘  └──────────────┘   └──────────────┘
```

Now each part, one at a time.

---

## 1. The Web App (Next.js) — *what you see*

**What it is:** the website. Chat window, policy library, the Ops Console. Built with **Next.js**, a popular framework for building websites with JavaScript/React.

**Why it exists:** it's the only thing humans interact with. It renders pages, handles clicks, and — importantly — **acts as a security guard**: your browser never talks to the backend directly. Every request goes through the web app's own `/api` routes first, which attach your verified identity.

**Repo folder:** `apps/web/`

**What happens without it:** nothing — there is no product.

---

## 2. The API Server (FastAPI) — *the brain*

**What it is:** a Python program that does all the real work:

1. **Retrieves** the right policy chunks from the database (hybrid search: keyword **and** vector similarity)
2. **Filters** them by your permission groups — at the SQL level
3. Runs the **deterministic rules**: must-escalate patterns, restricted-content probes, conflict detection
4. **Calls Azure OpenAI** to write the answer (only if credentials exist)
5. Records a **trace** of every step into the database

Built with **FastAPI**, a Python framework for building APIs (API = a way for programs to talk to each other over HTTP).

**Why it exists:** the AI model is unreliable by nature — it can hallucinate. All the *reliable* logic (permissions, escalation, citations, traces) lives in this Python code, and the model is only allowed to do the final writing step.

**Repo folder:** `backend/app/` (the `features/` subfolder has one module per capability: chat, escalations, ops, admin)

**What happens without it:** the website renders but nothing works — chat, policies, admin all need it.

---

## 3. The Database (PostgreSQL + pgvector) — *the memory*

**What it is:** a **PostgreSQL** database (the world's most popular open-source database) with one special extension: **pgvector**, which lets it store and search **embeddings**.

> **What's an embedding?** A list of ~1,500 numbers that represents the *meaning* of a piece of text. Texts with similar meanings get similar number-lists. This lets the database find "documents about leave entitlement" even when the question uses different words ("PTO", "vacation days").

**Why it exists:** it stores everything that must survive a restart — the 14 policies (chunked into sections, with embeddings), all users and their roles, every conversation, every trace, and the 36 gold test cases.

**Why "security-trimmed search" matters:** every search query includes your permission groups (`WHERE audience_group = ANY(:allowed_groups)`), so forbidden documents are never even *considered*. This is the core security feature of the project.

**Where it runs:** a managed **Render PostgreSQL** — Render creates it, backs it up, and hands your API the connection string automatically. You never install a database.

**Repo folder:** `backend/alembic/` (schema migrations) and `backend/app/features/models.py` (table definitions)

**What happens without it:** nothing can start. But you never set one up yourself — the Render Blueprint creates it.

---

## 4. Azure OpenAI — *the writer* (OPTIONAL)

**What it is:** Microsoft's cloud service for OpenAI models. Two things are used:

- A **chat model** (`gpt-5.6-luna`) — writes the final answer
- An **embedding model** (`text-embedding-3-large`) — converts text to those number-lists for the vector search

**Why it exists:** it's the only component that writes natural-language answers. Everything else is deterministic code.

**What happens without it (demo mode):** the app **still works** — sign-in, the policy library, permission denials, escalations, traces all function. Questions get an honest message: *"Demo mode: no AI key configured..."* Retrieval falls back to keyword-only search. You can add the key **later** without redeploying (doc 09 shows how).

**You need:** an Azure account with an OpenAI resource. This is the only paid-ish component (free credits usually cover a cohort). **Skipping it is fine for learning.**

---

## 5. Clerk — *the front door* (REQUIRED)

**What it is:** a login-as-a-service company. It handles the Google sign-in popup, the session tokens (JWTs — signed identity documents), and organizations.

**Why it exists:** building login securely is hard and error-prone. Clerk does it, and this app reads the signed identity from Clerk to decide who you are, then looks up your role (Admin / HR / User) in its own database.

**What happens without it:** nobody can sign in. **This one is required** — the deploy form asks for its keys.

**Where to get it:** [dashboard.clerk.com](https://dashboard.clerk.com) — free tier is enough. Doc 03 walks you through it.

---

## 6. Azure Blob Storage — *the filing cabinet* (OPTIONAL)

**What it is:** cloud file storage. The original policy Markdown files are uploaded there during ingestion.

**What happens without it:** nothing visible — the database already holds all chunked text. The app skips the upload and logs a line about it. Leave it blank in the deploy form.

---

## 7. Jira Cloud — *the ticket printer* (OPTIONAL)

**What it is:** Atlassian's ticketing system. When an escalation is confirmed in chat, the system creates a real Jira ticket in the HR project.

**What happens without it:** escalations still work end-to-end, but the ticket is a **synthetic key** (a locally-generated ticket ID) instead of a real Jira ticket. The flow is identical, just not connected to a real helpdesk.

---

## One more thing: the Render Blueprint

**What it is:** a single file, `render.yaml`, in the repository's root, that describes **your entire infrastructure**: the web app, the API, the database, and how they connect (including the private-network wiring between web and API).

**Why it exists:** it's what makes **one-click deploy** possible. Render reads this file and builds everything exactly as described — you never click through 20 setup screens or copy a database password. When the deploy form asks for your secret keys, it's because this file lists them as "fill in at deploy time."

---

## Repo map (for orientation only — you never need to touch code)

```
dss-logistics-hr-app/
├── apps/web/          ← the website (Next.js)
├── backend/           ← the brain (FastAPI + database schema)
├── corpus/            ← the 14 policy documents (Markdown files — readable!)
├── eval/              ← the 36 gold test cases (gold_cases.json)
├── scripts/           ← ingestion & seeding scripts
├── render.yaml        ← the Blueprint (one-click deploy definition)
└── docs/              ← documentation (you are here)
```

**Fun fact:** the entire policy corpus is just Markdown files in `corpus/`. You can read them like a book — that's also what the AI reads.

---

## ✅ Check yourself

1. Which component enforces permissions — the AI model or the API server's SQL?
2. What are embeddings, and which database extension stores them?
3. Name three things that still work in demo mode (no Azure key).
4. What file makes one-click deploy possible?

*(Answers: 1. The API server — the model never sees restricted documents. 2. Number-lists representing text meaning; pgvector. 3. Sign-in, policy library, permission denials, escalations, traces, quality gate. 4. `render.yaml`, the Render Blueprint.)*

---

*Next: [03 — Create your free accounts](03-create-your-free-accounts.md)*