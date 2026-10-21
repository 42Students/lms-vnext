# Work packet (wave 2): edit src/app/(authenticated)/teacher/allAssignments/error.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/teacher-all-assignments.md

## G2-4-012-060  [P2] GAP  facet F13  effort S
- Legacy: Initial fetch error shows connection guidance and Retry, distinct from empty. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:571-584`)
- vNext now: New error page same title but different subtitle and extra My teaching Courses link. (`src/app/(authenticated)/teacher/allAssignments/error.tsx:14-25`)
- Fix: Match exact legacy subtitle and retry layout.

## G2-4-012-061  [P2] GAP  facet F13  effort M
- Legacy: Failed refresh keeps old cards with Couldn't refresh assignments warning. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:708-718`)
- vNext now: New error boundary replaces page after failed server load. (`src/app/(authenticated)/teacher/allAssignments/error.tsx:14-25`)
- Fix: Retain scoped last successful list while retrying.

## G2-4-012-082  [P2] GAP  facet F20  effort M
- Legacy: Failed list refresh retains last rows; warning shown. (`docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:314-326`; `docs/legacy-source/frontend/src/components/Assignments/AssignmentsContent.jsx:708-718`)
- vNext now: New rerender/error boundary does not retain stale rows. (`src/app/(authenticated)/teacher/allAssignments/page.tsx:8-17`; `src/app/(authenticated)/teacher/allAssignments/error.tsx:14-25`)
- Fix: Keep scoped cached rows and retry notice.
