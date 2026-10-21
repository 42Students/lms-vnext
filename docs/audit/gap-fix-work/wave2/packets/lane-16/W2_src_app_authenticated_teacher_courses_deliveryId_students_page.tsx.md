# Work packet (wave 2): edit src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u001-faculty-course-tab.md, docs/audit/gap2/lane-3/course-student-roster.md

## G2-18-001-011  [P2] GAP  facet F02  effort M
- Legacy: Legacy Students tab uses sr-only title, visible `Class list` hero and metric chips before class select/search. `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:310-386`
- vNext now: vNext Students route adds PageHeader and roster with separate grid metrics and filters. `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx:33-46`, `src/components/courses/faculty-course-roster.tsx:123-183`
- Fix: Align students hierarchy, hero typography, metric chip style, and toolbar sequence.

## G2-18-001-069  [P2] GAP  facet F13  effort M
- Legacy: Legacy roster fetch failure shows error+Retry, never `No students yet`. `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:388-410`
- vNext now: vNext server loader throws into route error, without roster-local Retry. `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx:27-45`, `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/error.tsx:10-20`
- Fix: Render scoped inline retry state for roster failure distinct from empty roster.

## G2-18-001-095  [P2] GAP  facet F20  effort S
- Legacy: Legacy numeric `?cls` unauthorized candidate falls back to safe assigned class and rewrites URL. `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:67-82`
- vNext now: vNext `?cls` on roster/attendance returns 404 if not in authorized deliveries. `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx:17-25`, `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx:24-34`
- Fix: Choose desired compatibility fallback vs explicit 404; document exact expected UX.

## G2-3-009-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:189-223`
- vNext now: `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx:9-46`
- Fix: Legacy Students is tab within course PageShell with selected class query `?cls=`, vNext separate route `/teacher/courses/{deliveryId}/students` with full PageHeader; restore visual tab hierarchy.

## G2-3-009-002  [P2] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:310-335`
- vNext now: `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx:34-40`
- Fix: Old nested-tab Students heading is screen-reader-only and hero holds title; new visible PageHeader plus Class list subtitle duplicates prominence.

## G2-3-009-008  [P2] MISSING  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:352-365`
- vNext now: `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx:18-26`; `src/components/courses/faculty-course-roster.tsx:154-184`
- Fix: Legacy class Select popup accessible from roster toolbar if >1 assignment, vNext has no visible selector though query transition exists.

## G2-3-009-021  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:352-365`
- vNext now: `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx:18-26`
- Fix: Legacy Select Class width min(160px,100%), conditional multiple assignments; new route supports cls but no picker and required option selection.

## G2-3-009-029  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:213-223`
- vNext now: `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx:18-26`
- Fix: Old class switch Redux loginUserAction + shallow router classId query, new redirect jumps to separate delivery route with possible context loss.

## G2-3-009-036  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:387-406`
- vNext now: `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx:27-31`
- Fix: Legacy five-row active Skeleton and no-class selected informative empty state; vNext page must handle load via route loader and notFound separately.

## G2-3-009-038  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:401-406`
- vNext now: `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx:18-26`
- Fix: Legacy no class selected text `This course is not linked to one of your classes yet.`, new notFound or redirect on bad cls.
