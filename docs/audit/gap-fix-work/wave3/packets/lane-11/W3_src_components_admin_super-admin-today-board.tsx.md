# Work packet (wave 3): edit src/components/admin/super-admin-today-board.tsx

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-dashboard.md, docs/audit/gap2/lane-9/superadmin-dashboard.md

## G2-10-005-022  [P1] MISSING  facet F04  effort L
- Legacy: Old Today attendance-risk shows class/student and percent plus last-30-days context `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:164-176`
- vNext now: New Today reserves one null count for at-risk slot and text Not yet measurable `src/components/admin/super-admin-today-board.tsx:4-20`
- Fix: Add last-30-day attendance-risk calculation and student/percentage preview or mark intentionally unavailable

## G2-10-005-023  [P1] MISSING  facet F04  effort L
- Legacy: Old grading backlog shows ungraded submissions oldest date and course `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:180-190`
- vNext now: New Today has null in grading slot and generic unavailable explanation `src/components/admin/super-admin-today-board.tsx:4-20`
- Fix: Compute grading backlog with age and course-level rows or document missing module readiness

## G2-10-005-024  [P1] MISSING  facet F04  effort L
- Legacy: Old setup gaps details missing classes students lessons with drilldown `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:208-220`
- vNext now: New Today gap slot null and no list of specific broken structure `src/components/admin/super-admin-today-board.tsx:4-20`
- Fix: Restore setup gap counts and destination links per affected type

## G2-10-005-042  [P1] MISSING  facet F12  effort L
- Legacy: Old under-threshold uses marked sessions over last30 days `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:164-176`
- vNext now: New no risk computation, second Today card null `src/components/admin/super-admin-today-board.tsx:4-20`
- Fix: Match 30-day denominator and count only marked sessions

## G2-10-005-061  [P1] MISSING  facet F19  effort L
- Legacy: Old Today detail Rows show first items plus and N more when truncated `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:51-63`
- vNext now: New Today has no details arrays nor overflow labels `src/components/admin/super-admin-today-board.tsx:4-20`
- Fix: Build cap and remainder counts for preview rows and link to full page

## G2-9-035-022  [P1] MISSING  facet F04  effort L
- Legacy: Old Today attendance-risk shows class/student and percent plus last-30-days context `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:164-176`
- vNext now: New Today reserves one null count for at-risk slot and text Not yet measurable `src/components/admin/super-admin-today-board.tsx:4-20`
- Fix: Add last-30-day attendance-risk calculation and student/percentage preview or mark intentionally unavailable

## G2-9-035-023  [P1] MISSING  facet F04  effort L
- Legacy: Old grading backlog shows ungraded submissions oldest date and course `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:180-190`
- vNext now: New Today has null in grading slot and generic unavailable explanation `src/components/admin/super-admin-today-board.tsx:4-20`
- Fix: Compute grading backlog with age and course-level rows or document missing module readiness

## G2-9-035-024  [P1] MISSING  facet F04  effort L
- Legacy: Old setup gaps details missing classes students lessons with drilldown `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:208-220`
- vNext now: New Today gap slot null and no list of specific broken structure `src/components/admin/super-admin-today-board.tsx:4-20`
- Fix: Restore setup gap counts and destination links per affected type

## G2-9-035-042  [P1] MISSING  facet F12  effort L
- Legacy: Old under-threshold uses marked sessions over last30 days `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:164-176`
- vNext now: New no risk computation, second Today card null `src/components/admin/super-admin-today-board.tsx:4-20`
- Fix: Match 30-day denominator and count only marked sessions

## G2-9-035-061  [P1] MISSING  facet F19  effort L
- Legacy: Old Today detail Rows show first items plus and N more when truncated `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:51-63`
- vNext now: New Today has no details arrays nor overflow labels `src/components/admin/super-admin-today-board.tsx:4-20`
- Fix: Build cap and remainder counts for preview rows and link to full page

## G2-9-035-090  [P1] MISSING  facet F04  effort L
- Legacy: Legacy attendance not taken item displays course + class name and start time and faculty or no faculty set `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:149-160`
- vNext now: New first card only attendanceNotTaken numeric total `src/components/admin/super-admin-today-board.tsx:4-20`
- Fix: Add per-class preview rows with faculty/time fallback.

## G2-9-035-091  [P1] MISSING  facet F04  effort L
- Legacy: Legacy attendance-risk row shows student roll, percent badge, class, held/absent context `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:164-176`
- vNext now: New risk count permanently null `src/components/admin/super-admin-today-board.tsx:4-20`
- Fix: Compute 30-day risk and render each student/roll/percent list item.

## G2-9-035-092  [P1] MISSING  facet F04  effort L
- Legacy: Legacy no-teacher item displays course name / section / semester `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:194-205`
- vNext now: New course-without-teacher shows only total `src/components/admin/super-admin-today-board.tsx:4-20`
- Fix: Add college-bound unstaffed course preview with section and semester.

## G2-9-035-093  [P1] MISSING  facet F04  effort L
- Legacy: Legacy Setup gaps per category active batch no classes, section no students, student unassigned, course no lessons `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:208-220`
- vNext now: New fifth Today item null and Not yet measurable `src/components/admin/super-admin-today-board.tsx:4-20`
- Fix: Compute four setup-gap dimensions and render links.

## G2-9-035-094  [P1] MISSING  facet F04  effort L
- Legacy: Legacy quiz card includes title, course, optional class tooltip, close date/time `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:223-239`
- vNext now: New final card only count `src/components/admin/super-admin-today-board.tsx:4-20`
- Fix: Return preview quiz rows with deadline formatting/section tooltip.
