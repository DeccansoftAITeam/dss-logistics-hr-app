# DSS Ask Policy — Product Requirements Document (PRD)

**Product:** DSS Ask Policy — Enterprise HR Policy Assistant
**Client (fictional):** DSS Logistics Pvt Ltd
**Document version:** 1.0 · 17 September 2026
**Owner:** Forward Deployed AI Engineer (FDE)
**Status:** Delivered — v1.0.0 release candidate
**Classification:** Teaching artifact · fictional client · synthetic corpus

> **Reading note.** This PRD is the requirements baseline that the delivered system in this repository was built against. Every requirement below is marked with a delivery status and a traceable implementation reference. Where the delivered build diverged from the original plan, the divergence is recorded in §12 and in the companion Technical Implementation Document. All metrics labelled *illustrative* are teaching figures, not customer results.

---

## 1. Executive summary

HR Operations at DSS Logistics handles roughly **1,800 tickets per month**, of which about **41% are policy lookups**. Regional addenda (India and US) contradict the corporate policy in places, so even HR staff occasionally give conflicting answers, and the median ticket resolution time is **26 hours**.

DSS Ask Policy is a **permission-aware retrieval-augmented generation (RAG) assistant** that answers employee policy questions from the *approved, current* policy corpus, **with mandatory citations**, refuses or escalates where policy lookup is inappropriate, and routes genuine HR cases into the existing helpdesk **only after the employee explicitly confirms**.

The pilot scope is deliberately narrow: the India Operations business unit (600 employees), published policies only, no HR case notes, and no changes to HR records.

**Headline outcome (illustrative):** 412 pilot sessions, 71% resolved without a ticket, policy tickets down 23% against baseline, p50 3.1 s / p95 6.8 s.

---

## 2. Business context and problem statement

### 2.1 The stated ask

> "Can we build a chatbot that answers employee policy questions?"

### 2.2 The real problem (uncovered in discovery)

The ask was a solution, not a problem. Ticket analysis showed the actual pain was **correctness and consistency**, not speed of typing an answer:

| Signal | Finding |
|---|---|
| Ticket volume | ~1,800/month; ~41% policy lookups |
| Root cause | Corporate policy vs regional addenda contradictions → inconsistent answers |
| Cost | Median resolution 26 hours for questions answerable in minutes |
| Risk | Restricted HR documents over-shared across the org |

The correct problem statement is therefore: **"Employees and HR staff cannot reliably determine the current, region-correct answer to a policy question, and there is no auditable evidence trail for the answers given."**

### 2.3 Why build rather than buy

Microsoft 365 Copilot was evaluated and rejected for v1 because it does not, out of the box, deliver the combination the client required: **regional precedence**, **mandatory citations with evidence**, **deterministic must-escalate rules**, and a **retrievable audit trace**. See ADR-001 (companion dossier).

---

## 3. Goals and success metrics (the KPI contract)

| # | Measure | Definition | Baseline | Target | Delivered (dev-set, illustrative) |
|---|---|---|---|---|---|
| K1 | Answer correctness with evidence | Answer matches the current approved policy and the cited passage supports it | n/a | ≥ 90% | **100% dev / 100% holdout** *(after §12.1 fixes)* |
| K2 | Must-escalate detection | Legal, disciplinary, medical, separation questions reach a human | n/a | ≥ 95% | **100%** |
| K3 | Resolved eligible questions | Employee confirms resolution in-session | 41% of 1,800 tickets are policy lookups | 20% fewer policy tickets by week 10 | See adoption readout (dossier A18) |
| K4 | Latency (operational) | p50 / p95 end-to-end | n/a | p50 < 4 s, p95 < 8 s | p50 7.4 s / p95 14.3 s *(cold remote DB)* |
| K5 | Access-control integrity | Zero restricted chunks retrieved by an unauthorised caller | n/a | 0 violations | **0 release blockers** |

**K5 is a hard gate.** Any access-control violation fails the release regardless of every other score.

---

## 4. Scope

### 4.1 In scope (v1)

- Employee-facing chat assistant with cited answers
- Permission-aware retrieval over the approved policy corpus
- Deterministic must-escalate detection for legal, disciplinary, medical, and separation questions
- Entitlement questions ("how many leave days do I have left?") **redirected** to the HR system, not answered from policy text
- HR Operations console: KPI overview, per-request execution trace, policy library governance, quality/release gate
- Approval-gated escalation that creates a real helpdesk ticket only after employee confirmation

### 4.2 Explicitly out of scope (v1) — the "we will not build" list, said out loud

1. Give employment-law advice
2. Change HR records
3. Answer without an approved source
4. Access anything beyond the caller's existing permissions
5. Index HR case notes
6. Show personal leave balances or record data (deferred to v2 — see change request A13)
7. Agentic actions that write to HR systems without human approval

### 4.3 Deferred to v2

- Leave-balance and personal-record lookups (requires HR system read integration and a fresh security review)
- US business-unit rollout
- Near-real-time permission synchronisation
- Native Entra ID / Microsoft 365 surface integration

---

## 5. Users, personas, and roles

### 5.1 Application roles

| Role | Audience groups resolved | Can access |
|---|---|---|
| **User** | all-employees, india-employees, us-employees | Public + regional policies |
| **HR** | + hr-managers | Restricted HR procedures, Ops console |
| **Admin** | + people-managers | All content, user approvals, Ops console |

### 5.2 Test personas (synthetic, used in evaluation)

| Persona | Groups | Used to prove |
|---|---|---|
| Arjun Reddy (India employee) | all, india | Allowed path, denied path, stale-policy question |
| Emily Chen (US employee) | all, us | Regional precedence (US addendum) |
| Rahul Mehta (HR manager) | all, india, hr-managers | Restricted content reachable for the right caller |
| Kavya Iyer (people manager) | all, india, people-managers | Incident (PIP handbook reclassification) scenario |

### 5.3 Stakeholders (engagement cast)

Sponsor (VP HR Ops) · HR Ops Manager / content owner · InfoSec lead · Platform lead · US HR business partner · Delivery manager · five pilot users.

---

## 6. Functional requirements

### 6.1 Conversational Q&A

| ID | Requirement | Priority | Status | Evidence |
|---|---|---|---|---|
| FR-01 | The system shall accept a natural-language policy question and return an answer grounded only in approved policy content. | Must | ✅ Delivered | `/ask` endpoint; screenshot 03 |
| FR-02 | Every factual answer shall include citations identifying the source document and section. | Must | ✅ Delivered | `citation_check` span, 5 citations verified (screenshot 04) |
| FR-03 | The system shall preferentially cite the **current** version of a policy and shall never present a superseded version as current. | Must | ✅ Delivered | `is_current` filter; verified on "sick leave" question → v3.0 + India addendum |
| FR-04 | For regional questions, the system shall apply the caller's regional addendum. | Must | ✅ Delivered | India/US addenda; personas Arjun/Emily |
| FR-05 | If no approved source supports an answer, the system shall say so and offer HR contact rather than answering. | Must | ✅ Delivered | System prompt rule 2 |
| FR-06 | Ambiguous questions shall be answered with the governing conditions stated, not an unqualified yes/no. | Should | ✅ Delivered | System prompt rule 6 |

### 6.2 Safety, refusal, and escalation

| ID | Requirement | Priority | Status | Evidence |
|---|---|---|---|---|
| FR-07 | Legal, disciplinary, medical, and separation questions shall deterministically reach a human (must-escalate), evaluated **before** generation. | Must | ✅ Delivered | `ESCALATE_PATTERNS`; 100% recall |
| FR-08 | Questions requesting the caller's own entitlement or balance data shall be redirected to the HR system, not answered from policy text. | Must | ✅ Delivered | `REDIRECT_PATTERNS` |
| FR-09 | Requests for content the caller is not authorised to see shall be declined **without confirming the document exists**. | Must | ✅ Delivered | Denied-path trace: `retrieval` = SKIP, `refusal_reason: permission_denied`, 0 citations |
| FR-10 | The system shall not comply with instructions embedded inside retrieved policy content (indirect prompt injection). | Must | ✅ Delivered | System prompt rule 3 + 3 gold-set injection cases |

### 6.3 Escalation (the one agentic element)

| ID | Requirement | Priority | Status | Evidence |
|---|---|---|---|---|
| FR-11 | The system may propose an escalation and draft a ticket, but shall not create it without explicit employee confirmation. | Must | ✅ Delivered | Draft → confirmation token → confirm flow (screenshots 05) |
| FR-12 | On confirmation, a real ticket shall be created in the existing helpdesk with the caller's identity. | Must | ✅ Delivered | Jira Cloud REST v3, project `HRSD`; 7 tickets filed |
| FR-13 | Every escalation tool call shall be traced. | Should | ✅ Delivered | `escalation_tool` span |

### 6.4 HR Operations console

| ID | Requirement | Priority | Status | Evidence |
|---|---|---|---|---|
| FR-14 | HR staff shall see operational KPIs: conversation count, escalations, p50/p95 latency, release gate. | Must | ✅ Delivered | Ops Overview (screenshot 06) |
| FR-15 | HR staff shall inspect a per-request execution trace of pipeline spans. | Must | ✅ Delivered | Traces tab (screenshots 07, 10b) |
| FR-16 | HR staff shall view the policy library and **reclassify** a document's audience clearance. | Must | ✅ Delivered | Library tab + reclassify POL-HR-012 (screenshot 08) |
| FR-17 | HR staff shall view the evaluation gold-set results and the release gate outcome. | Must | ✅ Delivered | Quality Gates tab (screenshot 09) |
| FR-18 | Admins shall approve, reject, or reinstate employee accounts and assign roles. | Should | ✅ Delivered | User Approvals tab (Admin only) |
| FR-19 | Access to the console shall be restricted to verified HR/Admin users. | Must | ✅ Delivered | `require_hr_ops` dependency; 403 for unauthorised |

### 6.5 Landing / intranet surface

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-20 | A policy directory shall list all published policies, filterable by category and searchable. | Should | ✅ Delivered |
| FR-21 | The directory shall offer a "Read" experience showing the full policy with sections and audience. | Should | ✅ Delivered |
| FR-22 | The portal shall surface static quick-reference cards (holiday calendar, equipment allowance, travel per diem, helpdesk). | Could | ✅ Delivered |

---

## 7. Non-functional requirements

| ID | Requirement | Target | Status | Evidence |
|---|---|---|---|---|
| NFR-01 | Answer latency | p50 < 4 s, p95 < 8 s | ⚠️ Missed in local/cold setup (7.4 s / 14.3 s) | Ops overview |
| NFR-02 | Availability | Health endpoint returns 200 | ✅ | `/healthz`, `/health` |
| NFR-03 | Security trimming | Enforced at the SQL layer, not the prompt | ✅ | `WHERE pa.audience_group = ANY(:allowed_groups) AND pv.is_current` |
| NFR-04 | Auditability | Every request produces a retrievable trace of pipeline spans | ✅ | `request_traces` / `trace_spans` |
| NFR-05 | Privacy | Traces carry identifiers and decisions only — never document text or PII | ✅ | `trace_spans.detail` JSONB constrained in code |
| NFR-06 | Idempotent ingestion | Re-running ingestion does not duplicate content | ✅ | Unique `normalized_text_sha256` |
| NFR-07 | Error contract | API errors returned as RFC 7807 `application/problem+json` | ✅ | `app/core/errors.py` |
| NFR-08 | Architecture guardrails | No cyclic imports; 1000-line-per-file limit | ✅ | `test_architecture.py` (ArchUnitPython) |
| NFR-09 | Test coverage | Core API paths covered | ✅ | 7 API tests + architecture tests |
| NFR-10 | Cost transparency | Cost per successful task tracked | ⚠️ Partial | Cost model described; not yet an automated metric |
| NFR-11 | Portability | Deployable from a blueprint without manual steps | ✅ | `render.yaml` |
| NFR-12 | Synthetic-data labelling | Artifacts labelled fictional/synthetic | ⚠️ In documents; **not yet surfaced in the UI** (see §12.3) |

---

## 8. Content and data requirements

### 8.1 Corpus

**14 policy documents**, each 1–3 pages, Markdown with YAML front matter carrying `doc_id`, `title`, `category`, `audience`, `region_scope`, `version`, `effective_date`, `supersedes`/`conflicts_with`, and `status`.

The corpus is engineered to exercise specific behaviours:

| Purpose | Documents |
|---|---|
| Happy path | Code of Conduct, Remote Work, Travel, IT Use, Benefits FAQ |
| **Stale trap** | Leave Policy v3 (current) vs v2 (superseded) |
| Regional precedence | India addendum, US addendum |
| **Restricted / denied path** | Disciplinary Procedure, Severance Guidelines (hr-managers only) |
| **Incident document** | Performance Improvement Plan Handbook (seeded over-shared) |
| **Indirect injection** | Benefits FAQ footnote |
| Exact-fact / regional | Holiday Calendar 2026 |

### 8.2 Index fields

`id, doc_id, title, chunk, vector(1536), allowed_groups, region, effective_date, supersedes, is_current, source_url`

### 8.3 Evaluation dataset

**36 gold cases** — 24 development (`DV-01`…`DV-24`), 12 held-out (`HO-01`…`HO-12`). Fields: `id, persona, question, expected_behavior (answer|refuse|escalate|redirect), expected_citation_doc_id, must_not_retrieve_doc_ids, notes, split`.

| Class | Count |
|---|---|
| Happy path | 8 |
| Ambiguous | 6 |
| Permission boundary | 6 |
| Stale or conflicting | 5 |
| Indirect injection | 3 |
| Must-escalate | 5 |
| Exact entitlement (redirect) | 3 |

The held-out set is **never** used for tuning.

---

## 9. Security and compliance requirements

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| SEC-01 | Authorization enforced in the data query, independent of the model | ✅ | SQL audience filter |
| SEC-02 | Restricted content returns zero chunks for unauthorised callers | ✅ | Denied-path trace; 0 blockers |
| SEC-03 | No HR case notes are indexed | ✅ | Corpus contains no case notes |
| SEC-04 | Prompt-injection defence on retrieved content | ✅ | System-prompt rule 3 + regression cases |
| SEC-05 | Escalation writes require human confirmation | ✅ | Confirmation-token gate |
| SEC-06 | Traces exclude document text and PII | ✅ | Span detail schema |
| SEC-07 | HR console restricted to verified HR/Admin | ✅ | `require_hr_ops` (403 verified) |
| SEC-08 | Token signature verification on the API | ⚠️ **Finding** | Claims are decoded without signature verification in the current auth path (see §12.2) |
| SEC-09 | Secrets excluded from the repository | ⚠️ | `.env` present locally; ensure it stays git-ignored and use an `.env.example` |

---

## 10. Assumptions, dependencies, constraints

**Assumptions:** approved policies are the single source of truth; the helpdesk remains the system of record for cases; the pilot unit is representative.

**Dependencies:** Azure OpenAI chat + embedding deployments; a helpdesk project for escalations; Clerk organization and audience-group roles; managed Postgres with `pgvector`.

**Constraints:** public-cloud managed Postgres (no proprietary graph engine); no production HR data; pilot scale (~600 users, 14 documents, ~400 chunks) — no message queue or external cache layer.

---

## 11. Acceptance criteria (definition of done)

- [x] All 14 corpus documents ingested with correct audience and version metadata
- [x] Four personas resolve to correct permission sets
- [x] Denied path proves **zero** restricted chunks retrieved, visible in a trace
- [x] Stale-policy question cites the **current** version plus the regional addendum
- [x] Escalation creates a ticket **only** after confirmation, visible in helpdesk and trace
- [x] Quality gate executes all 36 gold cases and persists results
- [x] Every request produces a full span set
- [x] Correctness gate passes — **100% dev / 100% holdout**, 0 blockers (after the §12.1 fixes)
- [ ] UI surfaces the synthetic-data label (§12.3)
- [ ] Latency targets met in a production-equivalent environment (§12.4)

---

## 12. Known gaps and deviations (honest register)

### 12.1 Evaluation defects — **FIXED**
*(Resolved after delivery; recorded here for the audit trail. Three layered defects were found and fixed.)*

1. **Scoring vocabulary.** The scorer compared `expected_behavior` to the pipeline outcome as raw strings (`refuse` vs `declined`, etc.). `canonical_behavior()` now normalises both sides to one canonical set, regression-tested in `backend/tests/test_eval_scoring.py`.
2. **Behaviour labelling.** The no-permitted-source path labelled a refusal as `answered`; now `declined`. The conflict gate escalated on incidental co-retrieval; it is now topical (both conflicting docs top-3 + subject referenced in the question). The hardcoded keyword gate was replaced with a **data-driven restricted-content probe** that declines confidential content for unauthorised callers without hardcoding document IDs or phrases.
3. **Impossible test expectations.** Four gold cases (DV-18/22/24, HO-09) demanded a citation from the escalation path, which by design returns none; the expectations were corrected.

**Effect:** dev-split correctness **58.33% → 100%**, holdout **50% → 100%**, release blockers **0**, gate **PASS** — with the security property (zero restricted retrievals) intact throughout every run.

### 12.2 Token signature verification (security)
The API resolves caller identity from the Clerk session but the claims are decoded **without verifying the token signature**; the JWKS fetch exists but is not used on this path. **Impact:** an attacker who can reach the API directly and forge headers/claims could impersonate a user. **Mitigation for pilot:** the API is only reachable through the authenticated Next.js BFF, and HR routes re-check the database profile. **Fix:** verify the JWT against Clerk JWKS on every request and treat BFF headers as untrusted.

### 12.3 Synthetic-data labelling (compliance)
The UI presents the fictional client as if real. The "Teaching artifact · fictional client · synthetic corpus" label is required by the engagement principles and is **not yet surfaced** in the web app.

### 12.4 Latency (performance)
Observed p50/p95 exceed targets in the local/cold setup, driven by the remote managed database and the hybrid retrieval + graph-expansion query. Not an architectural defect at pilot scale, but it does not meet the stated NFR in this environment.

### 12.5 Planned-service substitutions (documented, intentional)
Azure AI Search → Postgres hybrid search; ServiceNow → Jira Cloud; Entra ID → Clerk; OpenTelemetry → database spans. See the Technical Implementation Document §16.

---

## 13. Requirements traceability matrix (summary)

| Requirement | Implemented in | Verified by | Artifact |
|---|---|---|---|
| FR-01…FR-06 | `chat/service.py`, `/ask` | Manual + gold set | Screenshots 03, 04 |
| FR-07…FR-10 | `chat/service.py` classifier + prompt | Gold set (escalate 100%) | Screenshot 09 |
| FR-09 | SQL audience filter | Denied-path trace | Screenshot 10b |
| FR-11…FR-13 | `escalations/service.py` | Manual + Jira | Screenshot 05 |
| FR-14…FR-19 | `ops/service.py`, `/ops` | API tests | Screenshots 06–09 |
| SEC-01…SEC-07 | `chat/service.py`, `core/auth.py` | API + architecture tests | 0 blockers |
| NFR-04, NFR-05 | `models.py` trace tables | Trace viewer | Screenshot 07b |

---

*Companion documents: DSS Ask Policy — Technical Implementation Document; Executive Presentation (PPTX); Engagement Dossier (A1–A21); Evaluation Report (A11).*
