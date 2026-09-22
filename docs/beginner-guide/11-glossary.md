# 11 — Glossary

Plain-English definitions of every term used in this guide. Alphabetical.

| Term | What it means |
|---|---|
| **API** | A way for two programs to talk over the internet. The "brain" of this app is an API server — the website sends it requests like "answer this question." |
| **Azure OpenAI** | Microsoft's cloud service that hosts OpenAI models (the chat writer and the embedding maker). |
| **Blueprint** | The `render.yaml` file that describes your whole system (web + API + database) so Render can create it all from one click. |
| **Bootstrap** | The one-time, automatic setup on first boot: create tables, load the 14 policies and 36 test cases. |
| **Build** | The step where Render downloads your code, installs its dependencies, and prepares it to run. |
| **Chunk** | A small piece of a policy document (one section). Documents are split into chunks so search can find the *relevant part*. |
| **Citation** | The reference under an AI answer showing exactly which policy section the answer came from. |
| **CLI** | Command-line interface — typing commands in a terminal instead of clicking. |
| **Cold start** | The ~50 s wake-up delay when a free-tier service has been idle 15+ minutes. |
| **CORS** | Browser security rule about which websites may call an API. Configured for you in the Blueprint. |
| **Database** | The program that stores data permanently (users, policies, chats). PostgreSQL here. |
| **Demo mode** | Running without an Azure OpenAI key: everything works except AI-written answers. |
| **Deploy** | The act of putting your app onto the internet so people can use it. |
| **Embedding** | A list of ~1,500 numbers representing a text's *meaning*. Similar meanings → similar numbers → searchable by the database. |
| **Env var (environment variable)** | A named setting a program reads at runtime, e.g. `AZURE_OPENAI_API_KEY`. Secrets live here, never in code. |
| **Escalation** | The system refusing to answer a sensitive question and instead drafting a ticket for human HR review. |
| **Fork** | Your own copy of someone's GitHub repository, under your account. |
| **Frontend / Backend** | Frontend = what you see (website). Backend = the server-side program it talks to (API). |
| **FastAPI** | The Python framework the backend is written in. |
| **Git** | The version-control tool that records code history. GitHub is the website that hosts it. |
| **GitHub** | Website hosting code repositories; where your fork lives. |
| **JWT** | JSON Web Token — a signed, tamper-proof identity card your login system issues. |
| **JWKS URL** | A public URL where login-token signatures can be verified. |
| **Log** | A running diary of what a program does; the first place to look when debugging. |
| **Next.js** | The framework the website is written in (JavaScript/React). |
| **pgvector** | A PostgreSQL extension that stores and searches embeddings. |
| **Permission trimming** | Filtering search results by what the asking user is allowed to see — enforced in the database query, before the AI sees anything. |
| **Persona** | A pretend employee identity (Arjun, Emily, Rahul, Kavya) used to demo permission/regional behavior without extra accounts. |
| **PostgreSQL** | The world's most popular open-source database — the "memory" of this app. |
| **RAG** | Retrieval-Augmented Generation: retrieve real documents first, make the AI answer only from them, cite the sources. |
| **RBAC** | Role-Based Access Control — users have roles (Admin/HR/User) that determine what they can see and do. |
| **Repo (repository)** | One project's code folder on GitHub. |
| **RQ7807 / Problem Details** | The standard error format the API returns (`title`, `status`, `detail`) so errors are machine-readable. |
| **Redeploy** | Rebuild and restart your service (happens automatically after env-var changes or new commits). |
| **Render** | The cloud platform hosting your three services. |
| **Secret key** | A private credential that must live only on servers (never in browsers, chats, or code). |
| **Sleep** | Free-tier pause after 15 idle minutes; next request wakes it (~50 s). |
| **Sync fork** | A GitHub button that pulls the original repo's latest changes into your fork. |
| **Token** | In the AI context: a chunk of a word (~4 characters); models bill and limit by tokens. In login context: a session credential. |
| **Trace** | The recorded step-by-step story of one request (auth → permissions → retrieval → model → outcome), viewable in the Ops Console. |
| **tsvector** | The PostgreSQL feature powering keyword (full-text) search. |

---

*Back to: [00 — Start Here](00-start-here.md)*