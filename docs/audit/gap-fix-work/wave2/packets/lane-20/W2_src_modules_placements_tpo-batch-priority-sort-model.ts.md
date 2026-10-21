# Work packet (wave 2): edit src/modules/placements/tpo-batch-priority-sort-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l13-u029-tpo-batches-index.md

## G2-13-029-014  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:92-94`
- vNext now: `src/modules/placements/tpo-batch-priority-sort-model.ts:1-17`
- Fix: Legacy sort prioritizes state IN_PLACEMENTS then students>0 then empty then FINISHED; vNext working priority uses eligible>0 and finish/endYear logic.

## G2-13-029-032  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:93-94`
- vNext now: `src/modules/placements/tpo-batch-priority-sort-model.ts:1-17`
- Fix: Default working batch ordering changed to eligibility-score priorities; a batch with no eligible but students undecided may rank differently.
