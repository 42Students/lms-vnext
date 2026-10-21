# Work packet: edit src/components/placements/super-admin-drive-quick-search.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-index.md, docs/audit/gap2/lane-6/l17-u030-superadmin-drives-landing.md

## G2-10-017-087  [P1] GAP  facet F23  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:41-45,523-597 — Active 60 card grid, attention badge, duplicate/extend actions is principal operator view.
- vNext now: src/components/placements/placement-operations-overview.tsx:37-110; src/components/placements/super-admin-drive-quick-search.tsx:36-46 — New reports/funnel and flat quicksearch rows take precedence; primary card screen gone.
- Fix: Rebuild card-first landing with attention above it.

## G2-17-030-072  [P1] GAP  facet F19  effort L
- Legacy: Legacy fetch active page size 60 and all page size 1 for counts. `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:98`
- vNext now: vNext getPlacementTpoOperations reads whole job list then client slices after filters. `src/components/placements/super-admin-drive-quick-search.tsx:18`
- Fix: Server-bound data query to 60 for landing, count all separately; avoid unbounded heavy joins.

## G2-10-017-035  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:215-226 — Search query updates URL, deletes `q` if blank.
- vNext now: src/components/placements/super-admin-drive-quick-search.tsx:17-33 — Local useState no query validation length, no URL.
- Fix: Enforce max100 and URL normalization.
