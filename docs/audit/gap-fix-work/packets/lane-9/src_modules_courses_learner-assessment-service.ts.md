# Work packet: edit src/modules/courses/learner-assessment-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/all-assignments.md

## G2-12-007-017  [P1] GAP  facet F05  effort M
- Legacy: Legacy GET assignments backend page 20, filter by course slug `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:246-248,282-309`
- vNext now: Server fetches entire authorized delivery set then JS filters/pages `src/modules/courses/learner-assessment-service.ts:63-73`
- Fix: Restore bounded server paging for large colleges

## G2-12-007-034  [P1] GAP  facet F10  effort S
- Legacy: GET all assignments via `getAllAssignments` paginated with course/role `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:282-309`
- vNext now: Joins delivery-scoped rows, filters own course, sorts by due/title `src/modules/courses/learner-assessment-service.ts:31-73`
- Fix: Align pagination, visibility, time ordering

## G2-12-007-047  [P1] GAP  facet F13  effort S
- Legacy: Failed refresh keeps stale cards and shows warning `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:709-717`
- vNext now: Server snapshot request; no retained stale list or banner `src/modules/courses/learner-assessment-service.ts:31-73`
- Fix: Retain last good data under error

## G2-12-007-065  [P1] GAP  facet F19  effort M
- Legacy: Legacy GET paged20, role/course filter and total count `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:282-309`
- vNext now: Loads all delivery assignments and quizzes then filters/sorts, pages client side `src/modules/courses/learner-assessment-service.ts:31-73`
- Fix: Add server-side paging where learner has many assessments
