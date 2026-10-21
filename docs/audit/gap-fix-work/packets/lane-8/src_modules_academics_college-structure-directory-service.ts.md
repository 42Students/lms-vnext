# Work packet: edit src/modules/academics/college-structure-directory-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u008-superadmin-classes.md

## G2-5-008-015  [P1] GAP  facet F04 Data formatting  effort M
- Legacy: Program/batch missing name Name unavailable (ID X) (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:391-398)
- vNext now: Inner joins and programName/cohortName no fallback (src/app/(authenticated)/admin/classes/page.tsx:87-88; src/modules/academics/college-structure-directory-service.ts:77-87)
- Fix: Show orphan records and explicit Name unavailable fallback.
