# Work packet (wave 2): edit src/modules/electives/admin-directory-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-electives.md

## G2-10-006-019  [P2] GAP  facet F05  effort M
- Legacy: Old status filter labels Active only and Incl. archived with boolean includeArchived `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:239-243`
- vNext now: New enum Status Active Archived All, which when Archived hides active records `src/app/(authenticated)/admin/electives/page.tsx:47-51` `src/modules/electives/admin-directory-model.ts:2-6`
- Fix: Offer inclusive Active only vs Incl. archived toggle; keep archived-only as additional advanced filter

## G2-10-006-044  [P2] GAP  facet F10  effort M
- Legacy: Old GET /api/v1/electives/admin/slots accepts programId semester includeArchived `docs/legacy-source/frontend/src/api/Services/ElectiveService.js:8-16` `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:59-62`
- vNext now: New direct listSuperAdminElectives query q status programId semesterNumber, no raw matching legacy contract `src/modules/electives/admin-directory-service.ts:11-22` `src/modules/electives/admin-directory-model.ts:2-7`
- Fix: Document field mapping and inclusive archived behavior for API compatibility
