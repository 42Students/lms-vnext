# Work packet (wave 3): edit src/db/schema/assessments.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/teacher-all-assignments.md

## G2-4-012-058  [P1] MISSING  facet F12  effort L
- Legacy: Legacy resource builder allows one Instructions and repeated other types. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:109-110`; `docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:735-766`)
- vNext now: New table has methods but not nested resource collection. (`src/db/schema/assessments.ts:26-75`)
- Fix: Add child storage, resources UI and constraints.
