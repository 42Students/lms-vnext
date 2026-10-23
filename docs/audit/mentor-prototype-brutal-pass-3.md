# Mentor prototype — brutal audit, pass 3

**Date:** 2026-10-24 · **Target:** `42Students/lms-vnext@main` · **Visual oracle:** original user-uploaded `42LMS pages prototype.html` (SHA-256 `80d648384233dcd432466a62a9603965e2a0145e0c341a3b13793af7746babc8`), decomposed screens 45–56 in the owner's ChatGPT Library.

**Verdict: 0/12 Mentor screens closed, 0/12 verified, 0/56 entire prototype set closed.** This pass implemented and source-reviewed material Mentor changes. It did **not** obtain running vNext screenshots, complete typecheck, lint, authenticated browser workflows, or confirmed passing GitHub Actions results. GitHub `main` push builds should trigger the existing CI workflow; source contracts were wired to its `source-contracts` job, but no passing result was returned in this chat.

## Implementation verified by source inspection, not browser

| # | Prototype screen | Evidence implemented | Still blocks exact-match closure |
|---:|---|---|---|
| 45 | Projects | Real assigned-project attention, local per-event Later, meeting/project-watch panels, six-column table, authorized task and sprint totals | Prototype student-level watch signals and exact triage/row geometry, responsive/browser comparison |
| 46 | Overview | Seven shared tabs, project heading, true sprint ribbon, status, real project/sprint/meeting/submission summary panels | Action positioning, detail pane hierarchy, milestone/release drilldowns and exact text/data states |
| 47 | Board | Real six-lane drag/keyboard status controls; Board/List switch; task search; selected-task inline pane; full dialog; comments and assignment preserved | Prototype task-approval/return with required feedback in pane, grouped sprint-list layout, keyboard J/K and A shortcuts, visual validation |
| 48 | Sprints & releases | Real sprint/release timeline, completed/planned-point chart, backlog metrics and old authorized lifecycle controls | Sign-off/carryover/ship workflows require prototype location, confirm-state audit, sample 16-sprint visual review |
| 49 | Team & meetings | Live student roster, assigned/done/review counts and original authorized team/meeting controls | Scheduling, attendance, notes, request handling, roster card specifics and exact composition |
| 50 | Performance | Per-student workload and real done/waiting/open/carried points; retained allocation/auto-assign editor | Prototype grouping by sprint, filters, warnings and complete action walkthrough |
| 51 | Resources | Existing search/type/visibility/status/pinned/task/sprint filters, file/resource actions, completed-sprint fold; hidden rows cannot be reordered | Pinned resource layout and sharing/upload modals, link access and pagination states |
| 52 | Activity | Source-backed recent event counts plus existing filtered/paginated history | Prototype grouping, actor/sprint filters, post activity action, empty/error visual parity |
| 53 | Final submission review | Actual evidence summary, safe repository/demo links, mentor Accept/Request changes, reversible issue chips, required feedback, optimistic CAS | Final review panel/evidence gallery, lock/reopen and review-history UI, stale-race/browser verification |
| 54 | Meetings | IST 7-day strip, selected live list/detail, Join project links, scheduled-only .ics download | Meeting requests/attendance/notes/review actions integrated into detail pane; permissions and calendar edge cases |
| 55 | Notifications | Six URL-backed category pills, unread using persistent server query, existing mark-read, project alerts, college announcements, help sidebar | Unified unread across source types unavailable; grouping, badge/count semantics and exact panel action placement |
| 56 | Everywhere | Working search for projects/meetings, route-aware role-authorized Mentor skin, retained bell/account controls | Student/task/resource full-text search absent; pixel-perfect global search popup, unread badge and profile dialogs not verified |

## Brutal blockers

1. **P0 — no rendered acceptance:** Browser captures of *running vNext* with actual authorized Mentor fixture data are not available. Comparing code or the original prototype's own render is insufficient.
2. **P0 — no CI pass observed:** The current changes are on `main` and need successful `npm run typecheck`, strict TS, ESLint, Vitest and the newly wired Node source contracts; no test result is asserted.
3. **P0 — Board review action mismatch:** The new selected-task pane supports inspection/comments/full dialog, but prototype Approve/Send Back actions and keyboard shortcuts are not reproduced in the pane. The underlying authorized task review service must remain authoritative.
4. **P0 — Sprints release lifecycle placement:** Sprint sign-off, carryover and ship/reopen flows exist elsewhere in the workspace but are not yet proven to follow prototype page-body placement and modal decision states.
5. **P0 — Review and meetings state machines:** Need confirmation of stale optimistic lock recovery, read-only observers, finished/archived workspaces, meeting requests, reschedules, attendance and notes.
6. **P1 — Visual typography and shell:** Prototype uses Lato, 200px desktop sidebar and 1440px frame. Responsive CSS and font fetching are not screenshot-verified.
7. **P1 — Missing aggregate signals:** Real per-student risk and cross-team search index are not implemented. Displayed summaries intentionally omit ungrounded prototype demo values.
8. **P1 — Cross-role authorization:** Fixed presentation bug by requiring actual role grants along with route. Must verify College Admin /tpo/home shortcut does *not* pick up TPO prototype skin and mixed Faculty+Mentor navigation stays correct.
9. **P1 — Notification unread limitations:** Unread is read-tracked only for personal inbox, not transient attention rows or college announcements. The six links filter supported sources explicitly; future unified persistence would be separate work.
10. **P1 — Calendar ICS RFC detail:** Downloaded VEVENT is sourced from valid scheduled instants and escapes text, but line-folding and timezone/import interoperability should be exercised with a real calendar client.
11. **P2 — Prior prototype source audit correction:** `projectSubmissionReviews` has `decision`, not `status`. Newly introduced incorrect `review.status` was corrected to `review.decision`.
12. **P1 — Dedicated prototype contract verification:** `tests/prototype-parity-shell-contract.test.mjs` now runs under the existing `source-contracts` GitHub CI job. It guards only the source structure; it cannot validate render positions or runtime behavior.

## Next closure actions

- **Engineering:** finish exact page-body interactive states for #47, #48, #49, #53, #54 and search #56; preserve tenant/membership security and state transitions. Then all 12 must pass strict TypeScript and functional CI.
- **Independent verification:** load authorized fixtures covering active/blocked/review/completed/stale/archived projects; capture all 12 live vNext routes at matching desktop viewport; overlay each with real prototype screenshot; fix remaining differences; audit interaction, keyboard, responsive and read-only modes.
- **Acceptance:** update `docs/prototypes/tpo-recruiter-mentor-parity.md` **only** when per-screen evidence is collected. A source-only check never changes any screen to VERIFIED or CLOSED.

This record intentionally does not invent test, screenshot or visual-pass results.
