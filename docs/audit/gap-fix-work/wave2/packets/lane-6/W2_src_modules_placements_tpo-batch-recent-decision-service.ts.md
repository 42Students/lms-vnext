# Work packet (wave 2): edit src/modules/placements/tpo-batch-recent-decision-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l13-u029-tpo-batches-index.md

## G2-13-029-027  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:147-155`
- vNext now: `src/modules/placements/tpo-batch-recent-decision-service.ts:9-33`
- Fix: Legacy undoEligibility(lastAction.actionId) global recent action; vNext per-cohort recent action map, direct history semantics differ.

## G2-13-029-039  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:147-160`
- vNext now: `src/modules/placements/tpo-batch-recent-decision-service.ts:9-33`
- Fix: Legacy undo affects batch eligibility decisions but route doesn't show notification side effects; vNext persisted decision events and notices require recipient comparison.

## G2-13-029-052  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:147-160`
- vNext now: `src/modules/placements/tpo-batch-recent-decision-service.ts:9-33`
- Fix: Legacy undoingRef stops double click globally; vNext per-batch undo control guards current action version, check stale action race.
