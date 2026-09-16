# DSS Ask Policy — Services, CLIs, Skills & MCP Setup Guide

**Status:** Project Runbook & Prerequisites Reference  
**Target Project:** DSS Logistics — Ask Policy Chatbot & HR Ops Console  
**Stack:** Next.js + FastAPI + SQLAlchemy 2.0 (async) + Render Managed Postgres (pgvector) + Azure OpenAI + Azure Blob Storage + Clerk + Jira Cloud

---

## 1. Services to Sign Up For

| # | Service | Purpose | Required Tier / Notes | Dashboard / Sign-up URL |
|---|---|---|---|---|
| 1 | **Microsoft Azure (AI Foundry / OpenAI)** | LLM Chat (`gpt-5.6-luna`) & Embeddings (`text-embedding-3-large`, 1536 dims) | Active Azure subscription with Azure OpenAI access. | [Azure Portal](https://portal.azure.com) / [AI Foundry](https://ai.azure.com) |
| 2 | **Microsoft Azure (Blob Storage)** | Unstructured policy document & asset storage | Standard Blob Storage account with a dedicated container (e.g. `dss-ask-policy-content`). Replaces Cloudflare R2 to avoid billing requirements. | [Azure Storage](https://portal.azure.com) |
| 3 | **Clerk** | Employee & Admin authentication, Session JWTs, Organization roles & custom permissions | Free tier. Create app `FDE-DSS-Logistics` and organization `DSS Logistics`. | [Clerk Dashboard](https://dashboard.clerk.com) |
| 4 | **Render.com** | Hosting Next.js Web Frontend, FastAPI Backend API, and Render Managed PostgreSQL | Free / Starter plan. Provides managed Postgres 16 with `vector` and `pgcrypto` support. | [Render Dashboard](https://dashboard.render.com) |
| 5 | **Atlassian Jira Cloud** | HR Escalation ticketing for sensitive / legal / separation policies | Free / Standard tier Jira Cloud instance. Site: `https://fde-dss-logistics.atlassian.net`, Project key: `HRSD`. | [Atlassian Admin](https://admin.atlassian.com) |
| 6 | **GitHub** | Code repository, version control, and CI/CD pipelines | Free / Team account. Organization: `DeccansoftAITeam`. | [GitHub](https://github.com) |

---

## 2. CLI Tools to Install & Authenticate

Install the following tools globally to allow automated provisioning, script execution, and pipeline testing.

### 2.1 Package Managers & Runtime
* **Node.js**: v20+ or v24+
* **Python**: 3.12+ (or 3.14)
* **pnpm**:
  ```powershell
  npm install -g pnpm
  pnpm --version
  ```

### 2.2 Azure CLI (`az`)
Used to manage Azure resources, storage containers, and keys.
```powershell
# Authenticate
az login

# Set active subscription if multiple exist
az account set --subscription "<subscription-id>"

# Create blob storage container
az storage container create --name "dss-ask-policy-content" --connection-string "<AZURE_STORAGE_CONNECTION_STRING>"
```

### 2.3 Clerk CLI (`clerk`)
Used to manage Clerk instances, pull environment variables, and manage organizations.
```powershell
# Install Clerk CLI
npm install -g clerk

# Authenticate via browser
clerk auth login

# Link project to the application
clerk link --app app_3JOiZIUHTh3nWms6hVxXI95tIc4

# Enable organizations feature
clerk enable orgs

# Pull environment variables
clerk env pull --file .env.clerk
```

### 2.4 Render CLI (`render`)
Used to manage Render services, databases, and environments directly from terminal.
* **Download Binary**: Download the latest release from [render-oss/cli](https://github.com/render-oss/cli/releases) (e.g. `cli_x.xx.x_windows_amd64.zip`) and add `render.exe` to your `PATH` (e.g. in `C:\Users\<user>\AppData\Roaming\npm`).
```powershell
# Authenticate via browser
render login

# Set active workspace
render workspace set <workspace-id> # e.g. tea-dal4e1lg1s2s73e7638g (dss-logistics)

# Create Render Managed PostgreSQL
render postgres create --confirm --name ask-policy-db --database-name ask_policy --database-user ask_policy_user --plan free --version 16

# Configure IP Access Control for development
render pg update <postgres-id> --confirm --ip-allow-list "cidr=0.0.0.0/0,description=anywhere"
```

### 2.5 Atlassian Forge CLI (`forge`)
Used to manage Atlassian Cloud integrations, Jira issue schemas, and app manifests.
```powershell
# Install Forge CLI
npm install -g @forge/cli

# Authenticate (prompts for email and Atlassian API Token)
forge login

# Verify login
forge whoami
```

### 2.6 GitHub CLI (`gh`)
Used for repository cloning, release downloads, and organization commits.
```powershell
# Switch to team account
gh auth switch --user DeccansoftAITeam

# Verify active account
gh auth status
```

---

## 3. Agent Skills to Install

Skills extend AI coding assistants with procedures, architecture templates, and verification runbooks.

### 3.1 Project Scaffolding Skills
* **`fullstack-render-web-setup`** (Customized Deccansoft Skill):
  - Location: `.agents/skills/fullstack-render-web-setup` and global `~/.gemini/config/skills/`
  - Purpose: Full-stack Next.js + FastAPI + Render Postgres monorepo setup with ArchUnitPython guardrails and zero React Native overhead.
* **`fullstack-project-setup`** (Upstream Base Skill):
  - Source: [DeccansoftAITeam/deccansoft-claude-skills](https://github.com/DeccansoftAITeam/deccansoft-claude-skills)
  - Version: 1.2.0 (includes ArchUnitPython decision #16).

### 3.2 External Vendor Skills
* **Clerk Skills**:
  ```powershell
  npx skills add clerk/skills
  ```
  Installed skills: `clerk`, `clerk-setup`, `clerk-cli`, `clerk-nextjs-patterns`, `clerk-backend-api`.

* **Cloudflare Skills** (Optional utility references):
  ```powershell
  npx -y skills add cloudflare/skills --skill '*' --yes --global
  ```
  Installed skills: `wrangler`, `agents-sdk`, `cloudflare`.

---

## 4. MCP (Model Context Protocol) Servers

MCP servers provide active tool integrations for AI coding agents. Configured globally in `~/.gemini/config/mcp_config.json`:

```json
{
  "mcpServers": {
    "render": {
      "serverUrl": "https://mcp.render.com/mcp"
    },
    "clerk": {
      "serverUrl": "https://mcp.clerk.com/mcp"
    },
    "cloudflare": {
      "serverUrl": "https://mcp.cloudflare.com/mcp"
    },
    "cloudflare-docs": {
      "serverUrl": "https://docs.mcp.cloudflare.com/mcp"
    },
    "cloudflare-bindings": {
      "serverUrl": "https://bindings.mcp.cloudflare.com/mcp"
    },
    "cloudflare-builds": {
      "serverUrl": "https://builds.mcp.cloudflare.com/mcp"
    },
    "cloudflare-observability": {
      "serverUrl": "https://observability.mcp.cloudflare.com/mcp"
    }
  }
}
```

---

## 5. Master Environment Configuration (`.env`)

Every service credential is consolidated into the root `.env` file for local development and backend execution:

```ini
# --- Database (Render Managed Postgres 16) ---
DATABASE_URL=postgresql+asyncpg://ask_policy_user:<password>@<db-host>.oregon-postgres.render.com:5432/ask_policy
RENDER_DATABASE_ID=<dpg-id>

# --- Azure AI Foundry / OpenAI ---
AZURE_OPENAI_ENDPOINT=https://suresh-azurefoundry-research.openai.azure.com/
AZURE_OPENAI_API_KEY=<api-key>
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-3-large
AZURE_OPENAI_CHAT_DEPLOYMENT=gpt-5.6-luna
EMBEDDING_MODEL=text-embedding-3-large

# --- Azure Storage (Policy Documents & Assets) ---
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=<storage-account>;AccountKey=<key>;EndpointSuffix=core.windows.net"
AZURE_STORAGE_CONTAINER=dss-ask-policy-content
STORAGE_BACKEND=azure_blob

# --- Clerk Authentication ---
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_<token>
CLERK_SECRET_KEY=sk_test_<token>
CLERK_JWKS_URL=https://<instance-domain>/.well-known/jwks.json
CLERK_ORG_ID=<org-id> # DSS Logistics
CLERK_APP_ID=app_3JOiZIUHTh3nWms6hVxXI95tIc4 # FDE-DSS-Logistics

# --- Render Platform ---
RENDER_WORKSPACE_ID=<workspace-id> # dss-logistics
RENDER_WORKSPACE_NAME=dss-logistics

# --- Jira Cloud Escalations ---
JIRA_SITE_URL=https://fde-dss-logistics.atlassian.net
JIRA_PROJECT_KEY=HRSD

# --- Application Server & Web ---
API_HOST=127.0.0.1
API_PORT=8000
WEB_ORIGIN=http://localhost:3000
```
