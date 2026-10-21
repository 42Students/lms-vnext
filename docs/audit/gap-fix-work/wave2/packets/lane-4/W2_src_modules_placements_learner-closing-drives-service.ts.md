# Work packet (wave 2): edit src/modules/placements/learner-closing-drives-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/learner-placement-jobs.md

## G2-14-005-084  [P2] GAP  facet F20  effort S
- Legacy: Legacy filter closing soon local moment calendar, vNext ISO server snapshot hour precision — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:71-83,586-593`
- vNext now: `src/modules/placements/learner-jobs-browse-model.ts:98-106`; `src/modules/placements/learner-closing-drives-service.ts:9-18`
- Fix: Use explicit IST day boundaries and snapshot consistently
