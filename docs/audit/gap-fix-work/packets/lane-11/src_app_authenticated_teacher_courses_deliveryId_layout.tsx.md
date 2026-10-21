# Work packet: edit src/app/(authenticated)/teacher/courses/[deliveryId]/layout.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u001-faculty-course-tab.md

## G2-18-001-039  [P2] GAP  facet F07  effort S
- Legacy: Legacy access errors distinguish `Faculty access required` vs `Could not load teacher course context`. `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:217-226`
- vNext now: vNext missing delivery returns 404 and errors `Unable to load Course workspace`, no role-specific message on this route. `src/app/(authenticated)/teacher/courses/[deliveryId]/layout.tsx:17-19`, `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/error.tsx:10-20`
- Fix: Distinguish no faculty role, revoked assignment and transient server failure with legacy copy where safe.
