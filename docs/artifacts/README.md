# DSS Ask Policy — Deliverable Artifacts

**Engagement:** FDE Case Study — fictional client engagement end to end
**Client (fictional):** DSS Logistics Pvt Ltd
**Classification:** Teaching artifact · fictional client · synthetic corpus
**Built:** September 2026 · Delivered v1.0.0

> Every document in this folder describes the **delivered** build in this repository. Where the build diverged from the original plan, the divergence is recorded explicitly as engineering debt rather than hidden.

---

## Deliverables

| # | Artifact | File | Format | Audience |
|---|---|---|---|---|
| 1 | **Product Requirements Document** | `DSS_Ask_Policy_Product_Requirements.md` | Markdown | Product, client sponsor, delivery |
| 2 | **Technical Implementation Document** | `DSS_Ask_Policy_Technical_Implementation.md` | Markdown | Engineers, technical reviewer, handover |
| 3 | **Executive Presentation** | `DSS_Ask_Policy_Executive_Presentation.pptx` | PowerPoint (15 slides) | Executives, CHRO, sponsor |
| 3b | Executive Presentation (read-only) | `DSS_Ask_Policy_Executive_Presentation.pdf` | PDF | Distribution |
| 4 | **Screenshot library** | `screenshots/*.png` | PNG (1440×900 @2x) | All of the above |

---

## The three documents at a glance

### 1. Product Requirements Document
The requirements baseline the system was built against.
- Business context and the real problem behind the ask
- The KPI contract (correctness, must-escalate, ticket reduction, latency, access control)
- Functional requirements (FR-01…FR-22), non-functional (NFR-01…NFR-12), security (SEC-01…SEC-09) — each with delivery status and evidence
- Explicit out-of-scope list and deferred v2 items
- Acceptance criteria and a **requirements traceability matrix**
- **§12 Known gaps** — the honest register (eval scoring defect, token verification, latency, labelling)

### 2. Technical Implementation Document
How the system is built, sufficient to operate/extend/redeploy from the repo + doc alone.
- Architecture, monorepo layout, technology stack
- Full data model (corpus, chunks, conversations, traces, evals, identity)
- The 10-step `/ask` request lifecycle, with hybrid RRF retrieval and graph expansion
- Permission enforcement model (authorization in SQL, not in the model)
- The approval-gated escalation tool (Jira Cloud REST v3)
- Observability (span rows + console trace viewer)
- Evaluation harness, deployment (Render Blueprint), runbook
- **§14 Engineering debt and findings** and **§16 Architectural decisions/substitutions**

### 3. Executive Presentation (15 slides)
The boardroom narrative, grounded in real screenshots.
1. Title
2. Executive summary
3. The problem (ask vs real problem)
4. The solution (two surfaces, one evidence trail)
5. Architecture
6. Security — the denied path, proven
7. Employee experience — a cited answer
8. Safety & escalation — the confirmation gate
9. Operations console
10. Observability — one request, eight steps
11. Evaluation — empirical gates
12. The KPI contract vs delivery
13. Integrity — what we are honest about
14. Next steps and roadmap
15. Closing

---

## Screenshot library

| File | Shows |
|---|---|
| `01_home_hero.png` | Intranet portal hero + quick-reference cards |
| `02_policy_directory.png` | Searchable, category-filtered policy directory |
| `03_chat_answer_cited.png` | Cited answer in the employee assistant |
| `04_chat_citations_expanded.png` | Expanded citation panel with source passages |
| `05_chat_escalation.png` | Must-escalate path with confirmation gate |
| `06_ops_overview.png` | Ops console KPIs (conversations, escalations, latency, gate) |
| `07_ops_traces.png` | Execution trace, message history + spans |
| `07b_ops_trace_spans.png` | Full pipeline span detail |
| `08_ops_library.png` | Policy library + reclassify action (incident control) |
| `09_ops_quality.png` | Quality Gates — 36 gold cases, **gate PASS (100% dev / 100% holdout)**. *Rendered from the persisted eval-run API data in console styling; the browser was unavailable for a live capture at build time. All values are the real stored results.* |
| `10b_ops_denied_trace.png` | **Denied path** — retrieval skipped, 0 citations |

---

## Companion artifacts (existing repo docs)

- `../FDE Case Study - Build and Delivery Plan.md` — the original engagement plan (A1–A21 dossier, 15 responsibilities)
- `../ask-policy-implementation-plan.md` — the self-contained build runbook
- `../deployment-pipeline-guide.md` — Render CI/CD pipeline guide
- `../setup-and-services-guide.md` — services and tooling setup
- `../Forward Deployed AI Engineer - Founding Cohort Webinar Deck v2.md` — webinar deck

---

## Regenerating the presentation

The deck is generated programmatically so numbers and screenshots can be refreshed. The generator script embeds the screenshots in this folder and writes both `.pptx` and (via PowerPoint) `.pdf`.

---

## Honesty note

This is a **teaching artifact**. The client, the people, the policies, the corpus, and the adoption figures are synthetic. What was **real**: the engineering failures — and the fixes.

1. **The measurement layer was itself the biggest bug.** The initial 58.33% was largely broken measurement: outcome vocabularies compared literally (`refuse` vs `declined`), refusals labelled as answers, a conflict gate firing on incidental co-retrieval, a hardcoded keyword gate that missed rephrased restricted-content questions, and four impossible test expectations (demanding citations from an escalation path that by design returns none). All fixed and regression-tested. Final: **100% dev / 100% holdout, 0 access-control blockers, gate PASS.**
2. **Token signature verification** is not applied on the API auth path — still open.

The fixes are recorded in PRD §12.1 and TID §14.1/§14.7; the remaining finding is in PRD §12.2 and TID §14.2, and on slide 13 of the presentation.
