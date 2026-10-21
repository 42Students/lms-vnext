# Work packet: edit src/modules/placements/learner-withdrawal-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/placement-applications.md

## G2-12-006-019  [P1] GAP  facet F06  effort M
- Legacy: Self withdrawal no reason; request withdrawal requires reason3..900 `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:178-188`
- vNext now: Both modes parse required reason min3 max900 `src/modules/placements/learner-withdrawal-model.ts:5-15`
- Fix: Do not require reason for valid self-withdraw
