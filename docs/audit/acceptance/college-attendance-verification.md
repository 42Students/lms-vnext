# College Attendance — gap verification (chat-3 round 2)

Audit `docs/audit/pages/college/attendance.md`; protocol `docs/orchestrator/briefs/gap-closure-lane.md`. Test file `tests/unit/college-attendance-gap-closure.test.ts` contains one test named with each queued gap ID. **Not executed:** orchestrator will run the tests after merging.

| ID | Status | Implementation evidence and named test |
| --- | --- | --- |
| COL-attendance-03 | DONE | `admin-grid-model.ts` expands all IST calendar days, weekday initials + shaded Sunday + no-class ✖; `admin-attendance-workspace.tsx`, test COL-attendance-03 |
| COL-attendance-04 | DONE | Monthly marked-only percentage, students, sessions held, absences, not marked and active days; `admin-attendance-workspace.tsx`, test COL-attendance-04 |
| COL-attendance-05 | DONE | Correction success persists as role=status and specific learner/session message; `admin-attendance-workspace.tsx`, test COL-attendance-05 |
| COL-attendance-06 | DONE | Record drawer shows status and saves once with disabled busy buttons; removed extra window.confirm; `admin-attendance-workspace.tsx`, test COL-attendance-06 |
| COL-attendance-07 | NOT-A-GAP | Preserve vNext first-class excused/medical/late for accuracy (owner approved intentional improvements). These are counted as non-present in percentage, not mislabelled in the UI; `admin-grid-model.ts`, test COL-attendance-07 |
| COL-attendance-09 | OPEN | Same Course across academic periods now exposes explicit term/delivery selector and validates exact selection in page loader; historical past-term labels still need supplied status metadata, so OPEN. Test COL-attendance-09 |
| COL-attendance-10 | OPEN | Elective slot details absent from the selected course option model; must not mark ordinary courses elective; test COL-attendance-10 |
| COL-attendance-11 | DONE | Invalid filters and missing selected college are rendered as calm in-page error with reset; route error boundary has Retry; `attendance/page.tsx`, test COL-attendance-11 |
| COL-attendance-12 | DONE | Per-IST-calendar-day CSV P/A/N, ✖ if none, bounded to the loaded college/month; multiple sessions separated by slash, spreadsheet formula neutralization; test COL-attendance-12 |
| COL-attendance-13 | DONE | Month name `October 2099` appears between navigation arrows; controls keep the selected course/class in URL; model `attendanceMonthLabel`, test COL-attendance-13 |
| COL-attendance-14 | OPEN | Real department denominator/threshold report needs an actual derived session count, not invented percent; test COL-attendance-14 (existing link only) |
| COL-attendance-15 | OPEN | Advanced department report filters by month/term/class not yet wired; test COL-attendance-15 (current tenant scope only) |
| COL-attendance-16 | DONE (source verified; tests not run) | College policy editor now provides guarded, accessible Reset to default confirmation (75% / 24h), warns that changing the window affects past corrections, and persists through the existing scoped PUT. The server records ATTENDANCE_POLICY_UPDATED with before/after values in the same transaction as the upsert. `college-attendance-policy-form.tsx`, `policy-service.ts`; `tests/unit/college-attendance-gap-closure.test.ts` — `COL-attendance-16 reset persists defaults with explicit existing-session warning and audited policy write`. |
| COL-attendance-17 | DONE | Screen-reader caption, column/button semantics and disabled-future explanation with keyboard focus; test COL-attendance-17 |

Graceful operation: section 3 guard and plain conflict copy, GR-71 loading/empty/failed distinction, GR-90 role=alert correction failures, GR-91 keyboard Retry; recorded in `docs/audit/acceptance/graceful-chat-3-verification.md`. Main's shared friendly-error and guarded-action helpers were not yet merged at round start, so no unapproved replacement was added.


## Round 6 — Elective evidence (not yet full slot parity)

| ID | Status | Evidence |
| --- | --- | --- |
| COL-attendance-10 | OPEN | Course and academic-period selectors now derive the "(elective)" label from the stored `courseOfferings.type` joined in `admin-service.ts`; regular courses are never guessed as electives. Slot names are not modeled, so full legacy Course + Slot wording stays OPEN. `tests/unit/college-attendance-gap-closure.test.ts`, named COL-attendance-10 test. |
