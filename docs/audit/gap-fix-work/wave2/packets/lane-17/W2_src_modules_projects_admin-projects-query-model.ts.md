# Work packet (wave 2): edit src/modules/projects/admin-projects-query-model.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/cross-10-list-conventions.md, docs/audit/gap2/lane-10/superadmin-projects-workspaces.md, docs/audit/gap2/lane-5/u028-superadmin-projects-section.md

## G2-10-031-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:81-116 — list q/status/page/size reflect URL shallow navigation.
- vNext now: src/modules/projects/admin-projects-query-model.ts:26-55 — strict query schema, typed GET navigation rather than shallow replace.
- Fix: Standardize deep-link param names and navigation semantics.

## G2-10-031-052  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:74-80,118-135 — abort ref, hydration guard, 400ms debounce, stale response protection.
- vNext now: src/modules/projects/admin-projects-query-model.ts:26-55 — strict server-parsed query does not reproduce client abort/soft refetch.
- Fix: Ensure stale response guard on client list controls.

## G2-10-031-057  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:81-103 — URL q/status/page/size, default20, 1-based in UI.
- vNext now: src/modules/projects/admin-projects-query-model.ts:26-55 — project URL parser defaults/allow-list; DB LIMIT/OFFSET src/modules/projects/admin-insights-service.ts:154-161.
- Fix: Create shared query convention with per-list allowed filters.

## G2-10-028-052  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:46-110 — URL hydrate avoids first wrong fetch, resets on college switch.
- vNext now: src/modules/projects/admin-projects-query-model.ts:26-55 — strict 1-based URL parse; unknown params rejected.
- Fix: Translate legacy bookmarks and scope reset.

## G2-5-028-017  [P2] GAP  facet F05  effort M
- Legacy: Legacy Table default 10 rows per page, showSizeChanger true, scroll x=1200. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:657-673`
- vNext now: vNext default pageSize20, range10..100 and cards/table view toggles. `src/modules/projects/admin-projects-query-model.ts:10-16`, `src/app/(authenticated)/admin/projects/page.tsx:84-98`
- Fix: Default 10 rows and preserve size selector placement.

## G2-5-028-067  [P2] GAP  facet F19  effort M
- Legacy: Legacy list GET all then frontend Table paginates 10 per page. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:136-165,657-674`
- vNext now: vNext query pushes paging (20 default) into DB and CSV export from displayed page. `src/app/(authenticated)/admin/projects/page.tsx:104-133`, `src/modules/projects/admin-projects-query-model.ts:10-16`
- Fix: Preserve 10-row size option, clarify export scope.
