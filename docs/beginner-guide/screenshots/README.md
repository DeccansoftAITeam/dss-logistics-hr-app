# Screenshot Checklist

Screenshots referenced by the beginner guide. Some exist already in `docs/artifacts/screenshots/` (linked from docs 01–02); the ones below are **missing** and need to be captured on a **fresh personal deployment** (not the shared demo) so URLs show typical `*-xxxx.onrender.com` forms and no real personal data is visible.

**How to capture (Windows):** Win+Shift+S → snip the region → save as PNG into this folder with the exact filename listed.

## Needed

| # | Filename | Where | What to show |
|---|---|---|---|
| 1 | `06_fork_button.png` | doc 05 | The fork's GitHub page, **Fork** button top-right, slightly zoomed |
| 2 | `06_deploy_button.png` | doc 06 | Fork's README with the **Deploy to Render** button visible |
| 3 | `06_deploy_form.png` | doc 06 | The Render blueprint form — **use fake/blanked key values** (blur secrets!) |
| 4 | `06_building_logs.png` | doc 06 | A service's Logs tab during a build (green spinner, log lines) |
| 5 | `06_live_dashboard.png` | doc 06 | Render dashboard with all 3 services showing **Live** |
| 6 | `06_bootstrap_logs.png` | doc 06 | API logs showing `Empty database detected...` → `Bootstrap complete` |
| 7 | `07_signed_in_header.png` | doc 07 | The app header after first sign-in, **Ops Console** link visible |
| 8 | `07_ops_tabs.png` | doc 07 | Ops Console overview with the 5 tabs |
| 9 | `07_trace_expanded.png` | doc 07 | A trace with ~8 spans, one span expanded |
| 10 | `07_user_approvals.png` | doc 07 | User Approvals tab (blur any real email) |
| 11 | `08_citation_expanded.png` | doc 08 | Chat answer + citation chip clicked open |
| 12 | `08_permission_denied_trace.png` | doc 08 | The disciplinary-question refusal + its trace with `permission_denied` |
| 13 | `09_env_tab.png` | doc 09 | API service Environment tab (blur values!) |
| 14 | `10_api_401_log.png` | doc 10 | API logs showing an Azure 401 (great teaching artifact) |

## Rules

- **Never screenshot a real secret key** — blur/redact anything from the worksheet (rows 2–7).
- Use the **persona switcher** rather than real colleague data in chat/trace shots.
- Keep each shot ≤ ~1200px wide; crop browser chrome where it doesn't teach anything.

## Already available (linked from docs 01–02, in `docs/artifacts/screenshots/`)

`01_home_hero.png`, `02_policy_directory.png`, `03_chat_answer_cited.png`, `04_chat_citations_expanded.png`, `05_chat_escalation.png`, `06_ops_overview.png`, `07_ops_traces.png`, `07b_ops_trace_spans.png`, `08_ops_library.png`, `09_ops_quality.png`, `10b_ops_denied_trace.png`