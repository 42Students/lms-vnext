# Work packet: edit src/modules/academics/semester-copy.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u025-semester-controller.md

## G2-5-025-029  [P3] GAP  facet F08  effort S
- Legacy: Legacy create toast names semester and next steps; edit/delete have dedicated success messages. `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:187-205`, `src/modules/academics/semester-copy.ts:3-23`
- vNext now: vNext copy keeps most messaging but in-page notice instead of antd toast. `src/components/academics/college-semester-management.tsx:60-68`, `src/modules/academics/semester-copy.ts:10-23`
- Fix: Match toast lifecycle and text location.
