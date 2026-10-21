# Work packet: edit src/modules/placements/college-drive-overview-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-overview.md

## G2-9-011-017  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:245-255` — Default absent metric Number(value ?? 0) shows 0
- vNext now: `src/modules/placements/college-drive-overview-model.ts:1-11` — Selected null rendered Not available; other observed metrics are zeros
- Fix: Distinguish unavailable new Selected from legacy stage count and keep zero fallback only for comparable metrics
