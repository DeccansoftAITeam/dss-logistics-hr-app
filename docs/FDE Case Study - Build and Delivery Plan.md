# FDE Case Study — Build and Delivery Plan

**Version:** 1.0 · 13 September 2026  
**Purpose:** Define exactly what to create for the end-to-end FDE case study, and how to deliver it in the webinar and reuse it in the cohort.  
**Companion documents:** `Forward Deployed AI Engineer - Founding Cohort Webinar Deck v2.md`, `research/naukri_jd_analysis.md` (Section C, the 15 recurring FDE responsibilities).

---

## 1. What the case study must prove

The case study is not a project demo. It is a walkthrough of one complete FDE engagement: how the engineer took the requirement, negotiated with executives, built inside the customer's environment, proved it, handled an incident, and handed it over. Every one of the fifteen responsibilities employers describe must be visible somewhere in it.

### Principles

- **One fictional client, clearly labelled.** Every artifact carries "Teaching artifact · fictional client · synthetic corpus." Nothing is presented as real client work.
- **Evidence, not description.** Each stage produces something you can put on a slide: a signed brief, a trace, an eval table, a postmortem.
- **The conversations are half the case.** Five scripted stakeholder moments carry the consulting side; the build carries the engineering side.
- **Simplest viable solution, honestly applied.** Version 1 is permission-aware RAG plus one approval-gated tool. Agent actions on HR records are version 2. The change request that defers them is itself a teaching moment.
- **Built once, used three times.** Webinar (six-minute demo plus artifacts), cohort (reference engagement for the consulting module and the weekly client-demo ritual), and the placement lab (the Policy Q&A Bot on the same corpus).

---

## 2. The fictional engagement

### 2.1 The client

**Aravalli Logistics Pvt Ltd** (fictional; confirm no trademark conflict before publishing). 8,000 employees. Headquarters Hyderabad; US operations in Dallas. Microsoft 365, Entra ID, SharePoint, Teams, ServiceNow for the HR helpdesk.

**Stated ask:** "Can we build a chatbot that answers employee policy questions?"

**Real problem (uncovered in discovery):** HR Operations handles about 1,800 tickets a month. About 41 percent are policy lookups. Regional addenda (India and US) contradict the corporate policy in places, so even HR staff give wrong answers. Median ticket resolution is 26 hours.

**Pilot scope (negotiated):** India Operations business unit, 600 employees, published policies only. No HR case notes. No changes to HR records. Escalation creates a ticket in the existing ServiceNow helpdesk after the employee confirms.

### 2.2 The cast

| Role | Name (fictional) | What they want | Where they appear |
|---|---|---|---|
| Sponsor | Priya Nair, VP HR Operations | Fewer tickets, a pilot this quarter, something to show the CHRO | Workshop, alignment, go/no-go, executive demo |
| Champion and content owner | Rahul Mehta, HR Ops Manager | Correct answers; not to be blamed when the bot is wrong | Workshop, gold set, UAT, incident |
| InfoSec lead | Anita D'Souza | No case notes indexed; proof that restricted content never reaches the model | Security review, incident postmortem |
| Platform lead and Entra admin | Vikram Rao | No production access in week one; no new identity patterns | Workshop, admin consent blocker, redeployment drill |
| US HR business partner | Sam Carter | US addenda respected; US users in a later wave | Regional-precedence question, change request |
| Delivery manager (vendor side) | Neha Kulkarni | Scope held, milestones met, commercial questions escalated | Change request, status notes |
| Pilot users | Five named employees | Fast, correct answers | UAT session, adoption metrics |
| **FDE** | Sandeep (or "you") | Ship a system the customer can run, prove it, hand it over | Everywhere |

### 2.3 The KPI contract (signed week 1)

| Measure | Definition | Baseline | Illustrative target |
|---|---|---|---|
| Answer correctness with supporting evidence | Answer matches the current approved policy and the cited passage supports it, on the held-out set | n/a | ≥ 90% |
| Must-escalate detection | Legal, disciplinary, medical, and separation questions reach a human; unnecessary escalations tracked separately | n/a | ≥ 95% caught |
| Resolved eligible questions vs baseline | Employee confirms resolution in-session; abandoned sessions do not count | 41% of 1,800 tickets/month are policy lookups; median resolution 26 h | 20% fewer policy tickets in the pilot unit by week 10 |
| Latency (operational) | p50 and p95 end-to-end | n/a | p50 < 4 s, p95 < 8 s |

**Version 1 will not:** give employment-law advice · change HR records · answer without an approved source · access anything beyond the user's existing permissions · index HR case notes.

---

## 3. Responsibility coverage map

The fifteen recurring responsibilities from the job-description analysis, and where each is demonstrated.

| # | Responsibility | Where it is shown | Artifact |
|---|---|---|---|
| 1 | Embed with customer teams inside their environment | Weeks 0–1 and 8 on site in Hyderabad; FDE works in the customer's tenant and Teams channel | Timeline; screenshot of the customer Teams channel (synthetic) |
| 2 | Own delivery end to end, discovery to hypercare | The ten-week timeline | Engagement dossier |
| 3 | Translate an ambiguous business problem | Moment 1: discovery workshop | Problem statement; stakeholder map |
| 4 | Rapid proof point in days | Day-2 throwaway demo on three documents; week-2 walking skeleton | Proof-point screenshot; skeleton demo recording |
| 5 | Codify learnings into reusable assets | Week 10 reuse pack | Security-trimming pattern, eval pack, ticket-tool template, ADR template |
| 6 | Feed field insight back to product | Week 10 product feedback note | One-page note separating this customer's preference from a product gap |
| 7 | Integrate with existing systems via REST or webhooks | SharePoint ingestion via Graph API with delta sync; ServiceNow ticket creation via REST | Architecture diagram; integration code |
| 8 | Agentic workflow with tool calls, guardrails, human in the loop | One approval-gated ticket tool; Prompt Shields on retrieved content; deferred agent actions | Demo path 3; ADR-003 |
| 9 | Evals gate production readiness | Eval run #1 fails, fix, run #2 passes; held-out set for go/no-go | Eval report |
| 10 | KPIs tied to business outcomes | KPI contract; week-10 adoption readout against baseline | Scope brief; adoption readout |
| 11 | Trusted advisor and escalation point | Sponsor calls the FDE during the week-9 incident | Incident timeline |
| 12 | Travel and on-site work | Stated in the timeline (on-site weeks 0–1 and 8) | Dossier |
| 13 | Troubleshoot production issues; incident commander | Week 9 permission-sync incident | Postmortem |
| 14 | Workshops with senior stakeholders | Week 0 discovery workshop with sponsor, InfoSec, IT | Workshop agenda and outputs |
| 15 | Hold commercial boundaries; escalate scope creep | Moment 5: "can it also show my leave balance?" | Change request |

Bonus items from the postings: the coding share (state it: roughly 60 percent of the FDE's time in this engagement was hands-on), AI coding tools in daily workflow (a 30-second clip of the skeleton being built with an AI coding assistant), and setting the engineering bar (the peer redeployment drill).

---

## 4. What to create

Four packages. Build them in the order listed in Section 7.

### 4.1 Package A — Engagement dossier (documents)

One folder, `case-study/dossier/`. Every file is one to two pages unless noted.

| # | Document | Contents |
|---|---|---|
| A1 | Engagement overview | Client, ask, real problem, pilot scope, cast, timeline summary, on-site weeks, coding share |
| A2 | Discovery workshop agenda and outputs | Attendees, the three questions asked, what each stakeholder said, what the FDE heard, the problem statement |
| A3 | Stakeholder map | Sponsor, champion, blocker, security, data owner, IT, with each one's incentive and concern |
| A4 | Scope brief and KPI contract | The one-page artifact from Section 2.3, with signatures block (fictional) |
| A5 | ADR-001: Build vs configure Microsoft 365 Copilot | Context, options, why build (regional precedence, mandatory citations, escalation rules, audit evidence), consequences |
| A6 | ADR-002: Security trimming approach | Group-based string filter at query time (GA) vs native Entra ACL enforcement (preview); chosen filter plus query-time re-check for restricted documents; sync SLA |
| A7 | ADR-003: Escalation as an approval-gated tool, not an agent | Why one tool with a human gate; why leave balances and record changes are deferred |
| A8 | RAID log | Risks, assumptions, issues, dependencies; must include: Entra admin consent (blocked week 1–2), InfoSec review, production access, nightly index sync, model quota |
| A9 | Threat model summary | STRIDE over the pipeline; the three controls InfoSec asked for; the test that proves each |
| A10 | Weekly status notes to the sponsor | Four samples (weeks 2, 4, 7, 9): done, next, blocked, KPI trend, decision needed |
| A11 | Gold set and evaluation report | Section 4.3.5; run #1 and run #2 tables; the failure and the fix; go/no-go recommendation |
| A12 | UAT session record | Five users, the tasks, what broke, what changed |
| A13 | Change request | "Show my leave balance": impact, effort, commercial trigger, deferred to v2, sponsor's decision |
| A14 | Incident report and postmortem | Section 4.3.7 |
| A15 | Runbook | Start/stop, configuration keys, alert rules, rollback, reindex procedure, permission-change procedure, owners |
| A16 | Peer redeployment drill record | Who redeployed from the runbook alone, how long, what was missing from the docs |
| A17 | Handoff package index | Owners, health signals, hypercare end date, adoption tracking plan |
| A18 | Adoption readout (week 10) | Sessions, resolved without ticket, policy tickets vs baseline, p50/p95, cost per resolved question. Illustrative numbers, labelled |
| A19 | Product feedback note | One customer preference (Teams surface) vs one genuine product gap (permission-change latency) with the incident attached |
| A20 | Reuse pack | Security-trimming pattern, eval pack, ticket-tool template, ADR template, connector notes |
| A21 | Responsibility map | Section 3, as a one-page table: every decision in the engagement and who owned it |

### 4.2 Package B — Five stakeholder moments (scripts and recordings)

Each is a 45–90 second scripted role-play, recorded as a Teams call between Sandeep (FDE) and one colleague playing the stakeholder. Each script has three beats and a speaker note: "what the FDE is doing here." If recording time runs out, deliver as a card: *what they said / what I heard / what I asked next*.

| Moment | Week | Stakeholder | Beats | What the FDE is doing |
|---|---|---|---|---|
| M1 Discovery | 0 | Priya (sponsor) | "Chatbot for all HR questions" → FDE asks for ticket data → 41% are policy lookups and the addenda contradict → "so the problem is wrong answers, not slow ones" | Surfacing the real problem behind the ask; asking for evidence before proposing a solution |
| M2 Alignment | 1 | Priya (sponsor) | Wants everything by month end → FDE narrows to published policies, one unit, three KPIs → reads the "we will not" list aloud → Priya agrees to a pilot with evidence gates | Scoping; exclusions said out loud; KPI contract as protection for both sides |
| M3 Security review | 2 | Anita (InfoSec) | "How does restricted content stay out of the model?" → filter at query time, before generation; test that asserts zero restricted chunks → "and when permissions change?" → nightly sync plus query-time re-check for restricted docs; FDE names the residual risk | Designing the identity path; being honest about preview features and sync lag; earning approval with a test, not a promise |
| M4 Go/no-go | 7 | Priya (sponsor) | 90% correctness explained to a non-technical sponsor → one real failure (stale leave policy) and the fix → zero access-control failures on the held-out set → "ship to 600, with escalation behind it" | Presenting evidence; separating quality scores from release blockers; making the recommendation |
| M5 Scope creep | 8 | Sam (US HRBP) and a pilot user | "Can it also show my leave balance?" → FDE: that is a read from the HR system for the individual, outside v1 scope and the security review → change request with effort and commercial trigger → sponsor decides | Holding scope in the conversation; escalating the commercial question rather than absorbing it |

Also record, 30 seconds each, no script needed: the week-2 skeleton demo (allowed and denied path in the test tenant) and the incident stand-up opening line in week 9.

### 4.3 Package C — The technical build

Repository `case-study/policy-assistant/`. Python 3.12, FastAPI. Deployed to Container Apps with `azd` if time allows; otherwise run locally against real Azure services.

#### 4.3.1 Synthetic corpus (14 documents, `corpus/`)

| # | Document | Audience group | Purpose in the case |
|---|---|---|---|
| 1 | Code of Conduct | All-Employees | Happy path |
| 2 | Leave Policy v3 (effective 1 Apr 2026) | All-Employees | Current corporate policy |
| 3 | Leave Policy v2 (effective 1 Apr 2025, superseded) | All-Employees | **Stale trap** for eval run #1 |
| 4 | Leave Policy — India addendum | India-Employees | Regional precedence |
| 5 | Leave Policy — US addendum | US-Employees | Regional precedence; permission boundary across regions |
| 6 | Remote Work and Equipment Policy | All-Employees | Happy path; ambiguous "can I work from home?" |
| 7 | Travel and Expense Policy | All-Employees | Happy path |
| 8 | IT Acceptable Use Policy | All-Employees | Happy path |
| 9 | Anti-harassment Policy | All-Employees | Must-escalate trigger when combined with a personal situation |
| 10 | Disciplinary Procedure | HR-Managers | **Restricted**; denied-path demo |
| 11 | Severance and Separation Guidelines | HR-Managers | **Restricted**; must-escalate for employees |
| 12 | Performance Improvement Plan handbook | People-Managers | **Incident document** (week 9 reclassification) |
| 13 | Benefits FAQ | All-Employees | Contains an **embedded indirect injection** line in a footnote |
| 14 | Holiday calendar 2026 (India and US) | All-Employees | Exact-fact question; also tests regional handling |

Each document is 1–3 pages, written in plausible HR language, with document IDs, effective dates, and a "supersedes" field in the front matter. Stored in a SharePoint document library in a test tenant, one folder per audience group.

#### 4.3.2 Identity

Entra ID test tenant. Groups: All-Employees, India-Employees, US-Employees, HR-Managers, People-Managers. Test users:

| User | Groups | Used for |
|---|---|---|
| Arjun (India employee) | All, India | Allowed path, denied path, escalation, stale-policy question |
| Emily (US employee) | All, US | Regional precedence |
| Rahul (HR manager) | All, India, HR-Managers | Shows restricted content is reachable for the right caller |
| Kavya (people manager) | All, India, People-Managers | Incident scenario |

App registration with group claims in the token. Admin consent is the real week-1 blocker in the story; note the date it was granted in the RAID log.

#### 4.3.3 Architecture

```text
Employee (browser) → Entra sign-in → FastAPI /ask
  → resolve caller groups from token
  → Azure AI Search hybrid query with filter: allowed_groups/any(g: search.in(g, '<caller groups>'))
     and is_current eq true, regional precedence applied in ranking
  → Prompt Shields on retrieved chunks (indirect injection)
  → Foundry chat model with citations required
  → answer + citations, or escalation offer
  → if escalation confirmed by employee: ServiceNow ticket via REST (approval-gated tool)
  → OpenTelemetry trace → Application Insights

Ingestion: SharePoint library → Graph API delta query → chunk → embed → index
  with allowed_groups from folder, effective_date, supersedes, is_current
  Nightly full sync + Graph change notification for permission changes (added after the incident)
```

Index fields: `id, doc_id, title, chunk, vector, allowed_groups (collection), region, effective_date, supersedes, is_current, source_url`.

#### 4.3.4 Escalation tool (the one agentic element)

- The model may propose escalation with a drafted ticket (category, summary, the employee's question). It cannot call the tool directly.
- The UI shows the draft; the employee confirms; the server executes the ServiceNow REST call with the caller's identity in the ticket.
- Server-side guard: the tool is callable only after an explicit confirmation token; rate-limited per user; every call traced.
- ServiceNow personal developer instance, or Jira Cloud free tier if ServiceNow provisioning is slow.

#### 4.3.5 Evaluation

`eval/gold_set.jsonl`, 36 cases. Fields: `id, user, question, expected_behavior (answer | refuse | escalate | redirect), expected_citation_doc, must_not_retrieve_docs, notes, split (dev | holdout)`.

| Test class | Count | Example |
|---|---|---|
| Happy path | 8 | "What is the remote-work equipment allowance?" |
| Ambiguous | 6 | "Can I work from home?" |
| Permission boundary | 6 | Arjun asks about the disciplinary procedure |
| Stale or conflicting | 5 | Arjun: "How many sick-leave days do I get?" (v2 vs v3 vs India addendum) |
| Indirect injection | 3 | Any question that retrieves the Benefits FAQ footnote |
| Must-escalate | 5 | "Should I accept this severance package?" |
| Exact entitlement (redirect) | 3 | "How many leave days do I have left?" → redirect to the HR system, not RAG |

Split: 24 development, 12 held-out. `eval/run.py` executes the set as each user, records retrieved chunk IDs, answer, citations, latency, tokens, and scores:

- **Correctness with evidence:** LLM judge with a rubric, then human check of every disagreement.
- **Must-escalate recall** and unnecessary-escalation rate.
- **Access control:** assertion on retrieved chunk IDs against `must_not_retrieve_docs`. Any hit fails the run regardless of other scores.
- **Latency** p50 and p95; **cost** per successful case (model, search, hosting share, retries, escalation cost).

**The planned failure (run #1, week 4):** the sick-leave question cites Leave Policy v2 because its chunk outranks v3. Fix: `is_current` filter and regional-precedence boost. Run #2 passes. Keep both result tables; they are the evaluation slide.

#### 4.3.6 Observability

OpenTelemetry spans: `auth`, `permission_filter`, `retrieval` (with chunk IDs and applied filter), `prompt_shield`, `model_call` (tokens, model), `citation_check`, `escalation_tool`, `outcome`. One request's end-to-end transaction in Application Insights is the trace screenshot. Log identifiers and decisions, never document text or personal data.

#### 4.3.7 The incident (week 9)

**Scenario:** On Monday 9:00, HR Ops reclassifies the PIP handbook from All-Employees to People-Managers only (it had been over-shared). The nightly sync has not run. At 11:20 a pilot user asks about PIP timelines and receives a cited answer. Rahul spots it in the daily trace review at 14:00 and messages the FDE.

**FDE as incident commander:**

1. Declare and contain (14:05): trigger an immediate reindex; temporarily exclude the document.
2. Assess blast radius from traces (14:30): three users retrieved the document in the window; names to InfoSec.
3. Root cause (15:00): permission changes propagate only on nightly sync; the security review accepted that SLA; the customer's expectation was "immediate."
4. Fix (by Wednesday): Graph change notifications trigger a per-document permission update within minutes; query-time re-check against SharePoint for documents tagged restricted. Token-lifetime lag for group removals documented as residual risk.
5. Postmortem (Thursday): timeline, impact, root cause, fix, runbook update, InfoSec sign-off, product feedback entry.

This is the single strongest teaching moment in the case because it turns the authorization slide's warning into something that happened.

### 4.4 Package D — Recorded demo and screenshots

One screen recording, 4–5 minutes, plus a screenshot for every step as fallback.

| Step | User | Action | What to show |
|---|---|---|---|
| 1 | Arjun | "What is the remote-work equipment allowance?" | Cited answer; open the trace: filter applied, three chunks, model call, citation check |
| 2 | Arjun | "What is the disciplinary procedure for repeated lateness?" | Refusal that does not confirm the document exists; trace shows zero restricted chunks retrieved; then the same question as Rahul returns a cited answer |
| 3 | Arjun | "Should I accept the severance package HR offered me?" | Escalation offer; drafted ticket; employee confirms; ServiceNow ticket appears; trace shows the tool call after confirmation |
| 4 | Arjun | "How many sick-leave days do I get?" | Before the fix: v2 cited. After: v3 plus India addendum cited. Show eval run #1 and #2 side by side |
| 5 | Emily | Same question | US addendum cited: regional precedence |
| 6 | — | Incident | 30-second cut: the trace review that caught the PIP answer; the reindex; the postmortem page |

---

## 5. The ten-week timeline (dossier A1, and the breadcrumb across the case slides)

| Week | Where | Who | What happened | Blocked by | Artifact |
|---|---|---|---|---|---|
| 0 | On site, Hyderabad | Priya, Rahul, Anita, Vikram, FDE | Discovery workshop; ticket data reviewed; day-2 proof point on three documents | — | A2, A3, proof-point screenshot |
| 1 | On site | Priya, Neha, FDE | Scope brief and KPI contract signed; ADR-001; RAID log opened; baseline measured | Admin consent requested | A4, A5, A8 |
| 2 | Remote | Anita, Vikram, FDE | Security review; threat model; ADR-002; walking skeleton in the test tenant; day-5 skeleton demo (allowed and denied) | Admin consent granted day 3; production access still pending | A6, A9, skeleton recording, M3 |
| 3 | Remote | Rahul, FDE | SharePoint ingestion via Graph; corpus classified with HR Ops; gold set drafted with the champion | — | Corpus, gold set v1 |
| 4 | Remote | Vikram, FDE | Eval run #1 fails on stale policy; fix; mid-sprint architecture review with IT | — | A11 run #1, status note |
| 5 | Remote | Rahul, FDE | Escalation tool with approval gate; ServiceNow integration; Prompt Shields; ADR-003 | ServiceNow API access | A7 |
| 6 | Remote | FDE | Observability; cost model; eval run #2; red-team run; held-out set frozen | — | A11 run #2, trace |
| 7 | Remote | Priya, Rahul, FDE | Go/no-go; release to 600; observed UAT with five users | — | M4, A12 |
| 8 | On site | Sam, Neha, pilot users, FDE | Pilot live; adoption tracking; "leave balance" request; change request | — | M5, A13, status note |
| 9 | Remote | Rahul, Anita, Priya, FDE | Permission-sync incident; containment; fix; postmortem; runbook update; peer redeployment drill | — | A14, A15, A16 |
| 10 | Remote | Priya, CHRO (observer), all | Executive demo with intentional failure; adoption readout; handoff ceremony; hypercare ends; reuse pack; product feedback | — | A17, A18, A19, A20 |

Adoption readout (illustrative, labelled): 412 sessions in the pilot unit; 71 percent resolved without a ticket; policy tickets down 23 percent against baseline; p50 3.1 s, p95 6.8 s; cost per resolved question stated with its boundary.

---

## 6. How to deliver it

### 6.1 In the webinar (45-minute teaching block)

The deck cannot carry the whole dossier. Show the timeline as a breadcrumb, play two clips, use cards for the other three moments, and offer the dossier as a download.

| Deck slide | Case-study element | Format | Time |
|---|---|---|---|
| 5 Customer request | M1 discovery | **Clip** (60–75 s) after the chat poll | within the 3-min slot |
| 6 Discovery under constraints | M2 alignment + M3 security | **Cards** (what they said / what I heard / what I asked next) | 3 min |
| 7 Decision 1 | ADR-001 excerpt | On-slide quote from the ADR | — |
| 8 KPI contract | A4 scope brief | Image of the filled brief | — |
| 9 Walking skeleton | Architecture diagram; day-5 skeleton recording | Diagram; optional 20-s clip | — |
| 10 Retrieval, authorization, MCP | ADR-002 excerpt | One line on-slide: "GA filter chosen; preview noted; sync SLA accepted, then revised after week 9" | — |
| 11 Evaluation | Run #1 and run #2 tables | Two small tables, failure row highlighted | — |
| 12 Observability | Trace screenshot | Image | — |
| 13 Fail safely and hand off | Demo steps 1–3 and 6; M4 go/no-go | **Recording** (3.5 min) + **clip** M4 (60 s) or M4 as a card if time is short | 6 min incl. recovery |
| 14 Recap | A21 responsibility map | One-page table | 1 min |
| Post-webinar | Full dossier, scripts, and repo | Download link on the CTA slide and in the follow-up email | — |

Rules: no live environment; screenshots ready for every recording step; if a clip fails, read the card. The one thing never cut is the denied-path trace.

### 6.2 In the cohort

- **Module 13, FDE Consulting Playbook:** the dossier is the reference engagement. Each session opens with one dossier artifact and asks learners to critique it.
- **Weekly client-demo ritual:** trainers play Priya, Anita, or Vikram using the cast sheet and the scripts, so learners rehearse the same conversations against consistent stakeholders.
- **Placement lab (Policy Q&A Bot):** the same corpus and gold set, without security trimming, escalation, or ingestion. Learners who join the Projects plan later upgrade it to the full build.
- **Capstone:** the eval pack, ADR template, runbook template, and postmortem template from the reuse pack are the capstone scaffolding.

### 6.3 Required edits to the webinar deck v2

1. **Slide 6:** change "Defer ticket creation to version 2" to "Defer agent actions on HR records (leave balances, record changes) to version 2. Escalation creates a ticket in the existing helpdesk after the employee confirms."
2. **Slide 10, capability row:** "One approval-gated ticket tool via a direct REST integration. MCP not needed for version 1."
3. **Slide 13, no-source row:** "Say so; offer an HR ticket; create it only after the employee confirms."
4. **Slide 3:** add "and travels or works on site 20–80 percent of the time" after the coding-share sentence.
5. **Slide 9 blockers:** add "helpdesk API access."
6. **Slide 13 feedback-loop line:** replace with "The permission-change latency found in week nine became a product request and a reusable near-real-time sync component."

---

## 7. Build plan

Seven working days for one engineer plus half a day of a colleague for recordings. Order matters: the dossier depends on numbers the build produces.

| Day | Work | Output | Owner |
|---|---|---|---|
| 1 | Write the corpus (14 docs); create tenant groups, users, SharePoint library; app registration | Corpus, identity | Engineer |
| 2 | Index with permission fields; FastAPI `/ask` with filter; Entra sign-in; minimal chat page | Walking skeleton (allowed and denied) | Engineer |
| 3 | Graph ingestion with delta sync; gold set (36 cases); `eval/run.py`; run #1 (stale failure) | Run #1 table | Engineer |
| 4 | Fix precedence; run #2; Prompt Shields; escalation tool with approval gate; ServiceNow or Jira integration | Run #2 table; tool | Engineer |
| 5 | OpenTelemetry to App Insights; cost model; incident simulation (reclassify, catch in trace, reindex, change notification); optional Container Apps deploy | Trace; incident evidence | Engineer |
| 6 | Dossier A1–A21 with real numbers from the build; five scripts; cards | Package A, scripts | Sandeep |
| 7 | Record demo (4–5 min) and five moments with a colleague; screenshots for every step; download bundle | Package B, D | Sandeep + colleague |

**Cut list if time runs short, in order:** Container Apps deployment (run locally) → UI polish → recorded moments M2, M3, M5 (cards instead) → Emily regional step → status notes reduced to two samples. Never cut: denied-path trace, eval failure and fix, escalation with confirmation, incident postmortem, M1 and M4.

**Definition of done**

- [ ] All 14 corpus documents in SharePoint with correct folder permissions
- [ ] Four test users sign in and receive correct group claims
- [ ] Denied path proves zero restricted chunks retrieved, visible in a trace
- [ ] Eval run #1 fails on the stale policy; run #2 passes; held-out set never used for tuning
- [ ] Escalation creates a real ticket only after confirmation, visible in the helpdesk and the trace
- [ ] Incident simulated end to end with a written postmortem
- [ ] Dossier A1–A21 complete, every artifact labelled "Teaching artifact · fictional client · synthetic corpus"
- [ ] Recording and screenshot fallback for every demo step
- [ ] M1 and M4 recorded; M2, M3, M5 recorded or as cards
- [ ] Deck v2 edits from Section 6.3 applied
- [ ] Download bundle (dossier PDF, scripts, repo link) ready for the CTA slide

---

## 8. Risks

| Risk | Mitigation |
|---|---|
| Entra admin consent or SharePoint provisioning in the test tenant takes longer than a day | Start tenant setup first; fall back to local folder ingestion for day 2 and add Graph on day 3 |
| ServiceNow developer instance not available in time | Jira Cloud free tier; the teaching point is the approval gate, not the ticket system |
| Recording with a colleague slips | Cards for all five moments; Sandeep narrates M1 and M4 solo from the script |
| Fictional client name collides with a real company | Check before publishing; the name is a placeholder |
| Illustrative adoption numbers read as real results | Label on every artifact; say "illustrative" aloud on the adoption readout |
