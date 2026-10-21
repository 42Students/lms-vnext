# Work packet (wave 2): edit src/modules/placements/college-drive-read-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-all.md

## G2-9-015-033  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:95-116` — URL q,status,page,size restores view; sizes 10/20/50/100.
- vNext now: `src/modules/placements/college-drive-read-model.ts:22-46` — URL q/status/page, no size; 25 fixed.
- Fix: Add selectable page size with URL/back restoration.

## G2-9-015-045  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:95-115` — Size [10,20,50,100] only; invalid size falls back20.
- vNext now: `src/modules/placements/college-drive-read-model.ts:12-20` — No size param, fixed25.
- Fix: Validate size allowlist and default20.

## G2-9-015-096  [P2] GAP  facet F20  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:95-115` — Invalid q/size restored with fallbacks.
- vNext now: `src/modules/placements/college-drive-read-model.ts:22-30` — Strict max100 query, 1..1000 page; invalid => filter error.
- Fix: Use predictable safe fallbacks where possible.
