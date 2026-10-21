# Work packet: edit src/app/(authenticated)/dashboard/page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-dashboard.md, docs/audit/gap2/lane-9/superadmin-dashboard.md

## G2-10-005-007  [P1] GAP  facet F02  effort M
- Legacy: No college global view consists of hero, exactly four action cards, scope tip `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:45-80`
- vNext now: No-college new view has page header four metric cards Safety scope and quick link grid `src/app/(authenticated)/dashboard/page.tsx:113-165`
- Fix: Match global section hierarchy and place metrics only where old scoped design shows them

## G2-10-005-031  [P1] MISSING  facet F08  effort M
- Legacy: Old Today fetch failure uses Couldn't load today's overview with Retry `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:102-109`
- vNext now: New Today receives null on service catch and displays unavailable cards, no Retry `src/app/(authenticated)/dashboard/page.tsx:104-106` `src/components/admin/super-admin-today-board.tsx:4-24`
- Fix: Render old explicit error and Retry rather than hiding backend failure as unknown values

## G2-9-035-007  [P1] GAP  facet F02  effort M
- Legacy: No college global view consists of hero, exactly four action cards, scope tip `docs/legacy-source/frontend/src/pages/superadmin/sections/Dashboard.js:45-80`
- vNext now: No-college new view has page header four metric cards Safety scope and quick link grid `src/app/(authenticated)/dashboard/page.tsx:113-165`
- Fix: Match global section hierarchy and place metrics only where old scoped design shows them

## G2-9-035-031  [P1] MISSING  facet F08  effort M
- Legacy: Old Today fetch failure uses Couldn't load today's overview with Retry `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:102-109`
- vNext now: New Today receives null on service catch and displays unavailable cards, no Retry `src/app/(authenticated)/dashboard/page.tsx:104-106` `src/components/admin/super-admin-today-board.tsx:4-24`
- Fix: Render old explicit error and Retry rather than hiding backend failure as unknown values
