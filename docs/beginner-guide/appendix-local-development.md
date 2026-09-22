# Appendix — Run the App on Your Own Laptop (Optional)

**What you'll learn:** set up a local development environment — the only part of this course where you install software.

**Do this only if** you want to modify the code. The deployed instance ([docs 06–08](06-deploy-with-one-click.md)) needs none of this.

> 💻 **You need Windows 10/11 with admin rights** (instructions are PowerShell-first; macOS/Linux users: the same tools, standard installers).

---

## Part 1 — Install the tools (one-time, ~20 min)

Install in this order. After each, verify with the given command in a **new** PowerShell window.

### 1. Git

1. Download from **[git-scm.com/downloads](https://git-scm.com/downloads)** → Windows → run the installer, click **Next** through everything (defaults are fine)
2. Verify:
```powershell
git --version          # e.g. git version 2.45.0
```

### 2. Node.js (website runtime)

1. Download the **LTS** installer from **[nodejs.org](https://nodejs.org)** → run it, defaults
2. Verify:
```powershell
node --version         # v20.x or v22.x is fine
```

### 3. pnpm (JavaScript package manager)

```powershell
npm install -g pnpm
pnpm --version         # any 9.x/10.x is fine
```

### 4. Python (backend runtime)

1. Download **Python 3.12** from **[python.org/downloads](https://www.python.org/downloads/)** → run installer
2. ⚠️ On the first installer screen, **tick "Add python.exe to PATH"** — the #1 setup mistake
3. Verify:
```powershell
python --version       # 3.12.x
```

### 5. VS Code (editor — optional but recommended)

From **[code.visualstudio.com](https://code.visualstudio.com)**. Then install the extensions: **ESLint**, **Prettier**, **Python**, **Ruff**.

**✅ Check yourself:** all four `--version` commands print numbers instead of "command not found".

---

## Part 2 — Get the code and dependencies (~10 min)

```powershell
# 1. Clone YOUR fork (replace YOUR-USERNAME):
git clone https://github.com/YOUR-USERNAME/dss-logistics-hr-app.git
cd dss-logistics-hr-app

# 2. JavaScript dependencies for the website:
pnpm install

# 3. Python environment for the backend:
cd backend
python -m venv .venv
.\.venv\Scripts\activate        # you should see (.venv) in your prompt
pip install -e .
cd ..
```

**✅ Check yourself:** `pnpm install` ends without red errors; the venv activates.

---

## Part 3 — Configure environment variables

Create a file named **`.env`** in the repo root. Minimum viable local setup:

```ini
# --- Backend ---
APP_ENV=development
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/ask_policy
AZURE_OPENAI_ENDPOINT=          # blank = demo mode locally
AZURE_OPENAI_API_KEY=

# --- Clerk (same values as your deployed instance / worksheet from doc 04) ---
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_ORG_ID=org_...
CLERK_JWKS_URL=https://....clerk.accounts.dev/.well-known/jwks.json

# --- Frontend → backend wiring ---
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

> 🗄️ **The database is the one thing you can't fake locally.** Two options:
> - **Easiest:** point `DATABASE_URL` at a **throwaway local Postgres** via Docker: `docker run -d --name dss-pg -e POSTGRES_PASSWORD=password -e POSTGRES_DB=ask_policy -p 5432:5432 postgres:16` (requires [Docker Desktop](https://www.docker.com/products/docker-desktop/)), or
> - **Zero-install:** create a free Render Postgres (doc 09 §5 shows how) and paste its External URL.
>
> The **bootstrap** runs on first start and creates the schema + corpus automatically — exactly like in production.

---

## Part 4 — Run everything

Open **two** PowerShell windows:

**Window 1 — backend:**
```powershell
cd backend
.\.venv\Scripts\activate
uvicorn app.main:app --port 8000
```
Watch for `Empty database detected - running one-time bootstrap...` then `Bootstrap complete`.

**Window 2 — frontend:**
```powershell
pnpm --filter web dev
```

Open **http://localhost:3000** → sign in with Google (your Clerk keys from the worksheet control who can sign in; your admin email from doc 04 becomes the local admin).

**✅ Check yourself:** the site loads locally and a policy question returns an answer (demo-mode message if no Azure key — expected).

---

## Part 5 — Running the tests (prove nothing broke)

```powershell
# Backend (33 tests):
cd backend
.\.venv\Scripts\activate
python -m pytest tests -q

# Frontend build check:
pnpm --filter web build
```

---

## Local ↔ deployed cheat sheet

| Concern | Local | Deployed |
|---|---|---|
| Website | localhost:3000 | your `*.onrender.com` URL |
| API | localhost:8000 | your API `*.onrender.com` URL |
| Database | local Docker Postgres / free Render DB | the Blueprint's DB |
| Secrets | `.env` file (never commit it!) | Render Environment tab |
| Code changes | instant (hot reload) | push to `main` → auto-deploy |

> 🔒 `.env` is in `.gitignore` — verify with `git status` that it never appears as an untracked/added file before committing.

---

## Troubleshooting (local-specific)

| Symptom | Fix |
|---|---|
| `python` opens the Microsoft Store | Reinstall with "Add to PATH" ticked |
| `pnpm` not found in new windows | Close and reopen PowerShell (PATH refresh) |
| DB connection refused | Docker container not running: `docker start dss-pg` |
| Clerk sign-in fails locally | Clerk may need `http://localhost:3000` in its allowed origins (Clerk dashboard → your app) |
| Port already in use | `uvicorn app.main:app --port 8001` and update `NEXT_PUBLIC_API_BASE_URL` to match |

---

*Back to: [00 — Start Here](00-start-here.md)*