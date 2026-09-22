# Facilitator Guide — Running the Beginner Track

**Audience:** the instructor. Learners never see this file.

---

## Course format

- **Total runtime:** ~3 hours + buffer. Best as one session with a break after doc 06, or two sessions (setup | deploy+demo).
- **Class size:** any. Pair up for docs 03–04 (accounts are easier with a buddy checking screens).
- **Room requirement:** participants need their own laptops and email access. Nothing to install beforehand — announce this loudly, it lowers anxiety.

## Session agenda

| Time | Segment | Learner doc | Your moves |
|---|---|---|---|
| 0:00 | Welcome + what we're building (10 min) | 01–02 live | Present the screenshots full-screen; tell the fictional-client story |
| 0:10 | Accounts (20 min) | 03 | Walk the room: GitHub → Render → Clerk. **Wait for stragglers at each account.** |
| 0:30 | Keys + worksheet (20 min) | 04 | Walk the room and eyeball worksheets — wrong admin email here is the #1 downstream failure |
| 0:50 | Fork (5 min) | 05 | Quick check: "your username in the URL?" |
| 0:55 | Deploy (45 min) | 06 | Form-filling together, field by field. Then *let them wait* — teach them to read logs during the wait |
| 1:40 | **Break (10 min)** | — | Deploy finishes in the background |
| 1:50 | First login (10 min) | 07 | Circulate — catch the "wrong email" people now |
| 2:00 | Demo tour (25 min) | 08 | Drive it on the projector first, then everyone replays on their instance |
| 2:25 | Ops: sleep, expiry, logs (15 min) | 09–10 | Q&A; show one real log-reading live |
| 2:40 | Wrap + homework | — | Homework = doc 08 solo + appendix if keen |

## The five failure hotspots (watch for these)

1. **`ADMIN_BOOTSTRAP_EMAIL` ≠ sign-in email** → person never becomes admin. *Prevention:* during doc 04, walk the room and have each participant say their chosen email aloud against the Google account they'll use.
2. **Clerk keys from two different Clerk apps** (publishable from one, secret from another) → redirect loops. *Prevention:* both keys must show the same instance domain.
3. **Deploying while signed into Render with someone else's account** → their instance lands in the wrong account. *Prevention:* doc 06 step 1 explicitly says "your own account."
4. **Typing the JWKS URL without the `/.well-known/jwks.json` suffix** → form accepts it, signature verification later fails. *Prevention:* worksheet row 5 checklist in doc 04.
5. **Impatience during first boot** → participants refresh-spam or "fix" working services. *Prevention:* during the 45-min deploy window, have them read logs and find the three bootstrap lines (it's a lesson, not a wait).

## Live-demo cue cards (your projector run)

**Demo A — the product (docs 01–02 recap):**
Home page → sign in → chat: "What is the remote-work equipment allowance?" → expand citation → policy library → Ops Console → open a trace, narrate the 8 spans.

**Demo B — the security story (the money demo):**
As regular employee: "What is the progressive disciplinary procedure?" → refused → Ops Console → trace → point at `permission_denied` and the SQL-level audience filter. Say: *"the model never saw the document — security by retrieval, not by prompt."*

**Demo C — the engineering story:**
Same question, India vs US persona (regional addenda). Then severance question → escalation draft → confirm → ticket. Then Quality Gates → run dev eval → scorecard. Land the phrase: *"retrieval you can audit, escalation you can trust, quality you can measure."*

## Timing per learner doc (observed)

| Doc | Fast | Typical | Stuck-prone? |
|---|---|---|---|
| 01–02 (reading) | 10 m | 20 m | no |
| 03 accounts | 10 m | 20 m | mild (Clerk org) |
| 04 keys | 10 m | 20 m | **yes** (worksheet discipline) |
| 05 fork | 2 m | 5 m | no |
| 06 deploy | 30 m | 45 m | mild (form typos) |
| 07 login | 5 m | 10 m | **yes** (email mismatch) |
| 08 demo tour | 15 m | 25 m | mild (sleep wake-up) |
| 09–10 (reference) | — | homework | — |

## Logistics checklist (you, before the session)

- [ ] Fork is public and the Deploy button renders on the fork page
- [ ] You clicked the deploy button yourself recently (fresh Blueprint run works)
- [ ] Projector has internet; you're signed into your Render + demo instance
- [ ] A second browser profile ready with a *fresh* Clerk account in case you need to demo account creation live
- [ ] Print/announce: the worksheet from doc 04 (some learners prefer paper)

## Homework

1. Complete the doc 08 tour on their own instance (screenshot each ✅)
2. Read doc 09; identify their DB expiry date on the Render dashboard
3. *(Ambitious)* Appendix: local setup + run the 33 tests
4. *(Optional, later sessions)* Change something in `corpus/`, sync fork, watch their deployment update — that's the "FDE owns the change" lesson

## After the session

Collect: what broke (add to doc 10), which screenshots are missing (see `screenshots/` checklist), timing reality vs. this agenda. Update these docs — they are a living curriculum.