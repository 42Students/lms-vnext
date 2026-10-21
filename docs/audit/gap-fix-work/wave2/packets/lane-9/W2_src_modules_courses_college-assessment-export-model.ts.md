# Work packet (wave 2): edit src/modules/courses/college-assessment-export-model.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/college-admin-quizzes.md, docs/audit/gap2/lane-4/college-admin-assignments.md, docs/audit/gap2/lane-4/superadmin-assignments.md, docs/audit/gap2/lane-4/superadmin-sections-assignments.md

## G2-3-001-017  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:436-438`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:270-283`
- vNext now: `src/components/courses/college-assessment-aggregate.tsx:258-261`; `src/modules/courses/college-assessment-export-model.ts:13-23`
- Fix: Use legacy `Due` local wall-clock formatting for CSV/current table; vNext CSV currently exports UTC ISO.

## G2-3-001-062  [P2] GAP  facet F14  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:265-285`
- vNext now: `src/modules/courses/college-assessment-export-model.ts:4-23`
- Fix: Legacy exports only 20 rows on current page with five named columns; vNext exports up to 1000 filtered records with 12 columns.

## G2-3-001-063  [P2] GAP  facet F14  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:267-285`
- vNext now: `src/modules/courses/college-assessment-export-model.ts:15-23`
- Fix: Set legacy CSV column order `Title,Course,Status,Points,Due` and filename `quizzes-college-{collegeId}-page-{page}.csv` if strict parity desired.

## G2-4-004-020  [P2] GAP  facet F04  effort M
- Legacy: Deadline uses `formatWallClock` with legacy local wall clock, export `YYYY-MM-DD HH:mm`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:329-339; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:348`)
- vNext now: Date column uses medium date/time formatted en-IN with explicit IST; export UTC ISO timestamp. (`src/components/courses/college-assessment-aggregate.tsx:41-48; src/components/courses/college-assessment-aggregate.tsx:272; src/modules/courses/college-assessment-export-model.ts:16-20`)
- Fix: Align local timestamp format and exported deadline timezone to legacy or record intentional IST normalization.

## G2-4-004-073  [P2] GAP  facet F14  effort M
- Legacy: Export deadline `YYYY-MM-DD HH:mm`, columns Title Course Scope Points Deadline Submitted Total students Graded. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:329-341`)
- vNext now: Export columns include Status, Due date (UTC), Results, different order. (`src/modules/courses/college-assessment-export-model.ts:13-25`)
- Fix: Restore exact CSV header/order and IST wall-clock formatting.

## G2-4-007-015  [P2] GAP  facet F04  effort M
- Legacy: Deadline visible local wallclock, export YYYY-MM-DD HH:mm. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:329-341;docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:348`)
- vNext now: Directory shows formatted due and export service uses UTC ISO. (`src/components/courses/admin-assessment-read-directory.tsx:21-25;src/modules/courses/college-assessment-export-model.ts:16-20`)
- Fix: Match exact legacy interaction and value or explicitly record approved divergence.

## G2-4-010-020  [P2] GAP  facet F04  effort M
- Legacy: Deadline uses `formatWallClock` with legacy local wall clock, export `YYYY-MM-DD HH:mm`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:329-339; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:348`)
- vNext now: Date column uses medium date/time formatted en-IN with explicit IST; export UTC ISO timestamp. (`src/components/courses/college-assessment-aggregate.tsx:41-48; src/components/courses/college-assessment-aggregate.tsx:272; src/modules/courses/college-assessment-export-model.ts:16-20`)
- Fix: Align local timestamp format and exported deadline timezone to legacy or record intentional IST normalization.

## G2-4-010-073  [P2] GAP  facet F14  effort M
- Legacy: Export deadline `YYYY-MM-DD HH:mm`, columns Title Course Scope Points Deadline Submitted Total students Graded. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:329-341`)
- vNext now: Export columns include Status, Due date (UTC), Results, different order. (`src/modules/courses/college-assessment-export-model.ts:13-25`)
- Fix: Restore exact CSV header/order and IST wall-clock formatting.
