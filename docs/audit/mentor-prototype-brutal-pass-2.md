# Brutal Mentor prototype audit — pass 2

**Date:** 2026-10-24 · **Target:** `main` · **Visual oracle:** actual unpacked screen HTML #45–56 from user-uploaded `42LMS pages prototype.html`. Original retained in ChatGPT Library `/LMS Prototype References/`; SHA-256 `80d648384233dcd432466a62a9603965e2a0145e0c341a3b13793af7746babc8`.

**Evidence:** Each HTML prototype screen's actual bundled template/CSS was parsed; relevant vNext app/component/service sources were fetched from `main` and changed. This pass did **not** run `tsc`, ESLint, a database, authenticated Playwright, or screenshot capture of *vNext*. Earlier prototype screen #45 itself was rendered and reviewed. It cannot confer a parity pass on vNext.

**Numerical result: 12/12 Mentor screens touched by implementation, 0/12 visual verified, 0/12 closed.** A shared component edit counts as coverage, not finished parity.

| # | Prototype | Implemented in this pass | Brutal remaining gap (blocks closure) | Severity |
|---:|---|---|---|---|
| 45 | Projects home | Real membership-scoped focus queue; event-scoped Later action; meeting/watch panels; six-column team list | Prototype needs precise contextual greeting, 5-item priority semantics, true student risk signals, avatar stacks, segmented sprint/task summaries, filter chips; actual table/browser parity unverified | P0 |
| 46 | Project overview | Seven-tab navigation; reusable project identity, status, real sprint ribbon, schedule/task links | Prototype summary, release path, health tiles, next-action block, member/activity preview not yet accurately composed or checked | P0 |
| 47 | Board | Correct tab location plus common shell | Prototype 6-lane board, sprint scope picker, list toggle, task detail/modals and approvals do not match existing workspace screen | P0 |
| 48 | Sprints & releases | Correct tab + real completed/current/planned sprint segments | Actual 16-sprint sample is **not** hard-coded; per-release cards, sign-off, carryover, ship/unship controls and decisions require detailed parity | P0 |
| 49 | Team & meetings | Correct tab/header/white content anatomy | Prototype roster/avatars, meeting requests, per-student controls, attendance and notes differ from current workspace | P0 |
| 50 | Performance | Correct tab/header/white content anatomy | Per-member throughput, assignments, workload, and auto-assign interactions still structurally different; no invented metrics | P0 |
| 51 | Resources | Correct tab/header/white content anatomy | Prototype filters, pinned/active resource rows, upload and share target workflows need separate review | P1 |
| 52 | Activity | Correct tab/header/white content anatomy | Sprint/user filtering, grouped history and posting still differ from prototype | P1 |
| 53 | Review final submission | Mentor primary Accept / secondary Request changes action labels and CAS review dialog preserved | Prototype evidence gallery, review reason chips, action placement, reopen/lock and confirmation states not reproduced | P0 |
| 54 | Meetings | IST seven-day strip, selectable upcoming/past list + meeting detail panel with authorized Join/Open links | Per-meeting action flow still lacks prototype scheduling/request decisions, attendance, notes and retro editing; side-by-side capture not run | P0 |
| 55 | Notifications | Scoped list and informational right panel, existing mark-read and source failure support retained | Prototype grouped timeline and five-chip filters, Mark all read header position, badge semantics not exact | P1 |
| 56 | Everywhere controls | Existing shell retained for bell/profile; mentor shell command now actually queries authorized projects and meetings | Full cross-team student/task/resource search remains unsupported; old topbar geometry still differs from prototype header/search/profile placement | P0 |

## Independent follow-up (latest main, 2026-10-24)
- A fresh connector-source check of **25 implementation/authorization invariants passed 25/25**; those are structural inspections and **not** executable tests.
- Mentor Projects now gets real `getMentorProjectWorkCounts` task totals and a new scoped `getMentorPrototypeSprintSummaries` query returning actual non-deleted sprint sequences/statuses; the six-column teams table renders these actual milestones instead of invented 16-sprint progress.
- The top-right Mentor desktop command/notifications/account controls are repositioned without removing authenticated actions; still no captured browser evidence.
- Attempted headless Chromium capture of the local `46-mentor.html` reference using both `file://` and localhost HTTP. Both were blocked by the environment with `net::ERR_BLOCKED_BY_ADMINISTRATOR`; **no screenshot was produced** in this pass. Previously available screenshot of #45 remains a genuine prototype reference only.
- No CI status checks or PR workflow runs were surfaced for the new `main` commits. No TypeScript/React run can be claimed.
- The remaining blocking defects below are still open. The verdict remains **0/12 VERIFIED, 0/12 CLOSED**.

## Issues found in the verification/source re-read

- **MR-001 / P0:** No live vNext captures at 1440×1080, 1440×1120, 1440×1240, 1440×1060, or 1440×1000; therefore no acceptable pixel difference or interaction evidence.
- **MR-002 / P0:** The prototype presents a seven-tab detail shell. Former vNext had eight tabs and different labels. The old Delivery view is preserved by direct `?tab=delivery` link and linked final review; it is intentionally not an eighth visible tab.
- **MR-003 / P0:** Generic `ProjectWorkspace` content remains substantially different across Board, Sprints, Team, Performance, Resources and Activity. Styling its section boxes does not close those workflows.
- **MR-004 / P0:** Project data is not uniform: some have no sprint, progress or members. Render stored counts and blank states; do not assert all 16 sample sprints exist.
- **MR-005 / P0:** The prototype's student-watch panel requires actual per-student signals, not aggregate per-project stalled data. Interim implementation labels the panel **Projects to watch**, expressly a deviation.
- **MR-006 / P1:** Later suppression currently uses localStorage per user and event key/timestamp, not durable backend snoozes. Confirm whether multi-device consistency is required.
- **MR-007 / P1:** Screens 53 and 54 need authorization and concurrent-update/review confirmation tests before interaction parity signoff.
- **MR-008 / P1:** The prototype uses Lato and 200–220px fixed sidebar; the current role-scoped stylesheet uses 200px and CDN Lato. Font availability, breakpoint behavior, side menu badge counts and exact horizontal offsets require captured comparison.
- **MR-009 / P1:** Mentor topbar's cross-team search returns project + meeting results only. Authorize a scoped search index for tasks, students and resources before claiming full screen #56.
- **MR-010 / P0:** Existing TypeScript and Playwright CI results were not executed or returned in this chat. All touched commits require independent verification. Old test expectations for eight tabs and `ProjectWorkspaceHeader` were updated, but must be executed.

## Acceptance gate per screen

1. Run `npm run typecheck`, strict tsc, `npm run lint`, mentor Vitest suite and e2e tests on latest `main`.
2. Obtain authorized Mentor fixture with multiple project states, sprints, blocked/review/requested meeting, final submission, active/archive, and empty/error data.
3. Render running vNext at exactly the prototype viewport(s), screenshot side by side, correct all measurable differences.
4. Exercise every action, dialog, keyboard flow, redirection, permission boundary, retry, and stale/concurrent review state.
5. Sign off each screen individually only after steps 1–4 pass. Keep `docs/prototypes/tpo-recruiter-mentor-parity.md` as durable ledger.

**Conclusion:** An implementation pass has been made on all Mentor surfaces, but it is false to call any of the 12 complete; every screen remains **IN PROGRESS**. Continue exact page-body remakes next. Changes are committed directly to `main` per owner instruction.
