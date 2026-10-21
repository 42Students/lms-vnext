# Work packet: edit src/modules/electives/admin-directory-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-electives.md

## G2-10-006-069  [P1] GAP  facet F19  effort M
- Legacy: Old list loads all selected program's slots then client paginates 20 and searches description `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:48-71` `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:125-129` `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:257-258`
- vNext now: New bounded SQL limit201 and truncates to 200, hides remaining matches `src/modules/electives/admin-directory-service.ts:39-50` `src/app/(authenticated)/admin/electives/page.tsx:107-108`
- Fix: Implement cursor/page query for complete catalogue and total matches, no silent result loss
