# Work packet (wave 2): edit src/app/(authenticated)/teacher/allAssignments/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/teacher-all-assignments.md

## G2-4-012-002  [P2] GAP  facet F01  effort M
- Legacy: Header right holds All courses picker and plus-icon Create Assignment. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:650-691`)
- vNext now: New header shows Assessment results overview; create trigger and course filter below. (`src/app/(authenticated)/teacher/allAssignments/page.tsx:13-17`; `src/components/courses/faculty-assessment-create.tsx:39-45`)
- Fix: Place picker and plus Create button in page-head toolbar.

## G2-4-012-075  [P2] GAP  facet F18  effort S
- Legacy: Header title My Assignments, action Create Assignment. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:650-691`)
- vNext now: Title matches, create isolated in separate section. (`src/app/(authenticated)/teacher/allAssignments/page.tsx:13-17`; `src/components/courses/faculty-assessment-create.tsx:39-45`)
- Fix: Match label location and Plus icon.

## G2-4-012-082  [P2] GAP  facet F20  effort M
- Legacy: Failed list refresh retains last rows; warning shown. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:314-326`; `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:708-718`)
- vNext now: New rerender/error boundary does not retain stale rows. (`src/app/(authenticated)/teacher/allAssignments/page.tsx:8-17`; `src/app/(authenticated)/teacher/allAssignments/error.tsx:14-25`)
- Fix: Keep scoped cached rows and retry notice.
