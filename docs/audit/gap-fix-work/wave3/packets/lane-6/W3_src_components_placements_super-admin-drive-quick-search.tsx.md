# Work packet (wave 3): edit src/components/placements/super-admin-drive-quick-search.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-index.md

## G2-10-017-009  [P1] MISSING  facet F02  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:460-597 — Active drives presented as 4-column hover cards, each logo, attention badge, count/deadline/menu.
- vNext now: src/components/placements/super-admin-drive-quick-search.tsx:19-50; src/components/placements/placement-operations-overview.tsx:85-108 — Quick search list articles and separate all-job portfolio rows, no active card grid.
- Fix: Build hover card grid first, retain extra reports in secondary panels.
