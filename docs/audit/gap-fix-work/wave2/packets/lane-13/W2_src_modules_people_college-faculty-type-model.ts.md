# Work packet (wave 2): edit src/modules/people/college-faculty-type-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/l15-u027-faculty-controller.md

## G2-15-027-008  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:21-24 exact FACULTY type display list includes role labels
- vNext now: src/modules/people/college-faculty-type-model.ts:2-12 broader Professor/Associate/etc values as employmentType
- Fix: Map FacultyType enum to display labels without treating faculty role as employment type.
