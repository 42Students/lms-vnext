# Work packet: edit src/modules/academics/college-mapping-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-admin-faculty-assignment.md

## G2-4-005-013  [P1] GAP  facet F05  effort M
- Legacy: Default lists inactive/active together. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:135-158;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:369`)
- vNext now: Query status defaults ACTIVE, hides historical. (`src/modules/academics/college-mapping-model.ts:16-23`)
- Fix: Default ALL or explicitly disclose hidden records.

## G2-4-005-062  [P1] GAP  facet F23  effort M
- Legacy: Legacy displays inactive rows by default. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:135-158;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:368-369`)
- vNext now: Active-only default. (`src/modules/academics/college-mapping-model.ts:16-23`)
- Fix: Show ALL default or clear historical count.
