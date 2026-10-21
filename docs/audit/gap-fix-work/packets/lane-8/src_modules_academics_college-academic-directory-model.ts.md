# Work packet: edit src/modules/academics/college-academic-directory-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-semesters.md

## G2-9-019-019  [P1] GAP  facet F05  effort S
- Legacy: Default pagination 10 Ant Table, page size changer and range `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:529-544`
- vNext now: Server pageSize defaults 10 but pagination says 25 per page fixed `src/modules/academics/college-academic-directory-model.ts:13-18` `src/components/academics/college-academic-directory.tsx:317-322`
- Fix: Fix static 25 per page label to reflect query.pageSize; expose size changer.
