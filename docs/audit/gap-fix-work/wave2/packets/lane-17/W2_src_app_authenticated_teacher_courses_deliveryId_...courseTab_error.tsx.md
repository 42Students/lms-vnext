# Work packet (wave 2): edit src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/error.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u001-faculty-course-tab.md

## G2-18-001-067  [P2] GAP  facet F13  effort S
- Legacy: Legacy route bootstrap errors are inline centered Alert inside canvas with 40px vertical padding and optional Try again. `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:217-229`
- vNext now: vNext route error is PageHeader+paragraph+Retry/Back links. `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/error.tsx:10-20`
- Fix: Match error icon, alignment, specific reasons and primary action wording.

## G2-18-001-069  [P2] GAP  facet F13  effort M
- Legacy: Legacy roster fetch failure shows error+Retry, never `No students yet`. `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:388-410`
- vNext now: vNext server loader throws into route error, without roster-local Retry. `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx:27-45`, `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/error.tsx:10-20`
- Fix: Render scoped inline retry state for roster failure distinct from empty roster.
