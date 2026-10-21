# Work packet: edit src/components/courses/faculty-assessment-overview.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/faculty-all-quizzes.md, docs/audit/gap2/lane-4/teacher-all-assignments.md

## G2-3-006-031  [P1] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:550-571`
- vNext now: `src/components/courses/faculty-assessment-overview.tsx:194-235`
- Fix: Legacy edit preflight checks attempts and shows Edit metadata modal; vNext metadata editor/questions editor split must lock immutable assessment fields after attempts.

## G2-3-006-037  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:403-434`
- vNext now: `src/components/courses/faculty-assessment-overview.tsx:194-251`
- Fix: Legacy shows Preview Quiz and Edit/Delete for faculty actor; new FacultyAssessmentOverview shows mutation controls only facultyOwned, shared offerings are read-only. Confirm parity/authorization decision.

## G2-3-006-039  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:540-571`
- vNext now: `src/components/courses/faculty-assessment-overview.tsx:197-235`
- Fix: Quiz after submissions may edit only title/description; verify vNext editor won't offer attempt limit/deadline regardless of authored status.

## G2-4-012-006  [P1] GAP  facet F02  effort M
- Legacy: Clicking noninteractive part of card opens read-only assignment drawer. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:126-134`; `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:397-400`)
- vNext now: No primary row click action; only nested manage/report/course links. (`src/components/courses/faculty-assessment-overview.tsx:163-255`)
- Fix: Add keyboard-accessible row View target with safe nested button handling.

## G2-4-012-019  [P1] GAP  facet F05  effort M
- Legacy: Filter by courseSlug, deduped per slug across teaching assignments. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:239-269`)
- vNext now: New filter by deliveryId; same course across sections appears repeatedly. (`src/components/courses/faculty-assessment-overview.tsx:103-120`)
- Fix: Offer course-level aggregation filter rather than individual delivery.

## G2-4-012-047  [P1] GAP  facet F10  effort M
- Legacy: Legacy GET faculty list with facultyId, active/enabled, courseSlug and server page size20. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:282-322`; `docs/legacy-source/frontend/src/api/Services/courseServices.js:431-443`)
- vNext now: New server aggregates all assignments across active teaching deliveries. (`src/modules/courses/faculty-assessment-service.ts:16-82`; `src/components/courses/faculty-assessment-overview.tsx:48-57`)
- Fix: Match legacy filtering and pagination or separate changed statuses.

## G2-4-012-053  [P1] GAP  facet F11  effort M
- Legacy: Legacy permits teacher CLASS/SHARED creation, but locks visibility on edit. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:86-97`; `docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:579-593`)
- vNext now: New fixed delivery scope and badge Shared Offering for existing rows. (`src/components/courses/faculty-lesson-authoring.tsx:384-398`; `src/components/courses/faculty-assessment-overview.tsx:174-177`)
- Fix: Restore authorized creation scope and edit immutability.

## G2-3-006-027  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/Table/table.js:575-589`
- vNext now: `src/components/courses/faculty-assessment-overview.tsx:194-235`
- Fix: Legacy delete toasts Deleting quiz… / Quiz deleted successfully, vNext archive lifecycle and notice wording differ.
