# 08 — Take Your App for a Spin

**What you'll learn:** a 10-minute scripted tour that proves every headline feature works **on your instance**.

**Before this step:** you're signed in as admin ([doc 07](07-first-login-become-admin.md)).

> 🎭 **About personas:** this app lets you *pretend to be different employees* (Arjun in India, Emily in the US, Rahul in HR, Kavya a manager) to see how answers change with permissions and region. Find the **persona switcher** in the header — it changes who the system thinks is asking, without needing multiple Google accounts.
>
> ⚠️ Do the tour **in order** — later steps build on earlier ones.

---

## Demo 1 — The happy path: an answer with citations (2 min)

**As persona: Arjun Reddy** (India)

1. Open the chat (bottom-right bubble, or the home page box)
2. Ask: **"What is the remote-work equipment allowance?"**
3. Wait ~5–15 s. You'll get an answer with an amount (₹25,000)
4. **Click a citation chip** under the answer → the source policy section opens

**What just happened (map it to doc 02):** the API embedded your question → searched the database *with an audience filter* → gave matching sections to the AI → the AI answered using only them → citations came from the actual retrieved chunks.

**✅ Check:** an answer, at least one citation, and the citation opens a real policy section.

*(Screenshot to add: chat answer with citation expanded)*

## Demo 2 — Regional awareness: India vs US (2 min)

1. Still as **Arjun** (India): ask **"How many annual leave days do I get?"** — note the answer (India rules: 20 days privilege leave + national rules)
2. Switch persona to **Emily Chen** (US): ask the **same question** — notice the answer now reflects **US addendum** rules (different terminology/entitlements)
3. Same question, different documents cited — because retrieval is filtered by your region audience group

**✅ Check:** the two answers cite different documents (`POL-HR-002-IN` vs `POL-HR-002-US`).

## Demo 3 — The permission wall (2 min)

1. As **Emily** (regular employee, US): ask **"What is the progressive disciplinary procedure?"**
2. Expected: a **refusal** — the disciplinary policy is confidential (`hr-managers` audience), and the system detects that the best-matching document is one you can't see
3. Admin bonus round: Ops Console → **Conversations** → open this conversation → **View trace**. The trace shows the refusal reason: `permission_denied` — the system *proves* it refused for the right reason

**✅ Check:** refused, not answered; the trace confirms the reason.

*(Screenshot to add: permission-denied answer and its trace)*

## Demo 4 — The escalation gate (2 min)

1. As any employee persona: type **"Should I accept this severance package?"**
2. Expected: the AI **does not answer**. It says the matter requires formal HR review and offers a confirmation button for an escalation draft
3. Click **Confirm** → the system "files" the ticket: with Jira credentials it creates a real Jira ticket; without them you get a synthetic ticket key — same flow, honest fallback

**✅ Check:** refusal + escalation draft + confirmation produces a ticket reference.

## Demo 5 — The conflict gate (optional, 2 min)

1. As **Arjun**: ask **"What is the per diem allowance when traveling to Mumbai?"**
2. Expected: the system **detects a conflict** between the corporate travel policy (`POL-HR-007`) and the India addendum, and escalates instead of guessing

**✅ Check:** an escalation mentioning a policy conflict.

## Demo 6 — The quality gate (admin, 2 min)

1. Ops Console → **Quality Gates**
2. Click **Run eval** (split: `dev`) — this runs a set of the 36 gold test questions against your live system
3. Watch the score come back: % correct, escalation recall, latency

**What this proves:** the system grades *itself* against pre-written expectations — the difference between "an AI demo" and "an engineered system."

**✅ Check:** an eval run completes and shows a scorecard.

---

## You've now proven, on your own deployment:

- [x] Retrieval-augmented answers with mandatory citations (D1)
- [x] Regional personalization (D2)
- [x] Database-level permission enforcement (D3)
- [x] Deterministic escalation to humans (D4, D5)
- [x] Execution tracing & self-evaluation (D6)

**This app is yours.** Doc 09 shows how to operate it day-to-day; doc 10 is for when something breaks.

---

*Next: [09 — Operate your deployment](09-operate-your-deployment.md)*