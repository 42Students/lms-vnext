# Work packet: edit src/modules/placements/college-drive-read-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-all.md

## G2-9-015-028  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:487-502` — Status default all, backed by isActive/isDraft bools.
- vNext now: `src/modules/placements/college-drive-read-model.ts:3-20` — Status enum DRAFT PUBLISHED CLOSED ARCHIVED; default PUBLISHED.
- Fix: Preserve All baseline and legacy draft/open mapping.

## G2-9-015-032  [P1] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:256-264` — Server list sort postedDate DESC, status all, pageSize20.
- vNext now: `src/modules/placements/college-drive-read-model.ts:3-20` — Initial status PUBLISHED, sort TITLE ASC, pageSize25.
- Fix: Use all drives + newest posted DESC + 20 rows by default.

## G2-9-015-067  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:254-265` — Legacy categories all/draft/active/closed from isDraft/isActive.
- vNext now: `src/modules/placements/college-drive-read-model.ts:5-8` — PUBLISHED/CLOSED/ARCHIVED/DRAFT enum with default PUBLISHED.
- Fix: Map old status categories and their visibility accurately.

## G2-9-015-046  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:95-115` — Invalid status query falls back all and invalid size to20.
- vNext now: `src/modules/placements/college-drive-read-model.ts:3-30` — Strict enum/query parse triggers Invalid drive filters.
- Fix: Use graceful defaults while retaining typed query errors.
