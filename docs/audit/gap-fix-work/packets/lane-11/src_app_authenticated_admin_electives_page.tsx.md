# Work packet: edit src/app/(authenticated)/admin/electives/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-electives.md

## G2-10-006-007  [P1] GAP  facet F03  effort L
- Legacy: Old slot Table has Slot Program Sem Year Credits Pick Offerings Students Status Actions `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:204-226`
- vNext now: New article list has name/program/semester/status, metrics behind Slot details `src/app/(authenticated)/admin/electives/page.tsx:79-106`
- Fix: Restore exact 10-column table and interactive slot-name and action columns

## G2-10-006-069  [P1] GAP  facet F19  effort M
- Legacy: Old list loads all selected program's slots then client paginates 20 and searches description `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:48-71` `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:125-129` `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:257-258`
- vNext now: New bounded SQL limit201 and truncates to 200, hides remaining matches `src/modules/electives/admin-directory-service.ts:39-50` `src/app/(authenticated)/admin/electives/page.tsx:107-108`
- Fix: Implement cursor/page query for complete catalogue and total matches, no silent result loss

## G2-10-006-035  [P2] GAP  facet F07  effort M
- Legacy: Old lookup errors include Unavailable: programs courses faculty classes batches `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:89-117` `docs/legacy-source/frontend/src/components/admin/electives/ElectivesConsole.jsx:249-252`
- vNext now: New options only programs and academic periods; no per-dependency failure banner `src/modules/electives/college-slot-mutation-service.ts:45-61` `src/app/(authenticated)/admin/electives/page.tsx:31-34`
- Fix: Restore partial lookup failure messaging and Retry before editor actions
