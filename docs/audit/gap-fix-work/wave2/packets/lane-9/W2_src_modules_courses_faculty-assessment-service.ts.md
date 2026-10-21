# Work packet (wave 2): edit src/modules/courses/faculty-assessment-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/faculty-all-quizzes.md, docs/audit/gap2/lane-4/teacher-all-assignments.md

## G2-3-006-032  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:459-475`; `docs/legacy-source/frontend/src/api/Services/quizServices.js:7-12`
- vNext now: `src/modules/courses/faculty-assessment-service.ts:16-79`
- Fix: Legacy GET /api/v1/quizzes faculty returns pageable rows; vNext Drizzle batch over active teaching deliveries and excludes archived. Verify draft/all-owned coverage.

## G2-3-006-036  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:101-110`
- vNext now: `src/modules/courses/faculty-assessment-service.ts:62-79`
- Fix: Legacy state scope keyed by role/user/class/course/page, vNext server listing scope keyed by access context. Verify stale cross-account browser state.

## G2-3-006-053  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:459-504`
- vNext now: `src/modules/courses/faculty-assessment-service.ts:16-79`; `src/components/courses/faculty-assessment-overview.tsx:24-57`
- Fix: Legacy server filters and reports total+submitted across pages; vNext loads all quizzes and client filters; performance/total accuracy at large faculty loads to test.

## G2-4-012-016  [P2] GAP  facet F04  effort M
- Legacy: Teacher total uses server totalElements, distinct courses counted from currently loaded page. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:303-312`; `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:360-374`)
- vNext now: New totals use all aggregated rows and unique course codes. (`src/components/courses/faculty-assessment-overview.tsx:84-91`; `src/modules/courses/faculty-assessment-service.ts:114-139`)
- Fix: Match page vs total denominator and course distinctness.

## G2-4-012-079  [P2] GAP  facet F19  effort L
- Legacy: Old server pages size20, fetches small submission preflight on deletion. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:282-309`; `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:441-454`)
- vNext now: New eager aggregation of assignments and submitted IDs, client page slicing. (`src/modules/courses/faculty-assessment-service.ts:69-90`; `src/components/courses/faculty-assessment-overview.tsx:48-57`)
- Fix: Add bounded server paging and efficient submission existence fetch.
