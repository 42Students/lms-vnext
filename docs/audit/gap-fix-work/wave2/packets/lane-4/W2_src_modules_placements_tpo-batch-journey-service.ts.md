# Work packet (wave 2): edit src/modules/placements/tpo-batch-journey-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l13-u029-tpo-batches-index.md

## G2-13-029-012  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:71-75`
- vNext now: `src/modules/placements/tpo-batch-journey-service.ts:13-65`
- Fix: Legacy journey(b) includes additional placement funnel counts beyond eligibility; vNext four per-card fields Invited, Registered, Verified, Placed (offer evidence).
