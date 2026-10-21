# Work packet (wave 2): edit src/modules/placements/tpo-batch-workspace-read-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l13-u029-tpo-batches-index.md, docs/audit/gap2/lane-6/tpo-batches-controller.md

## G2-13-029-026  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:121-129`
- vNext now: `src/modules/placements/tpo-batch-workspace-read-service.ts:27-40`
- Fix: Legacy one getBatches fetch returns batches, lastAction, outsideBatches; vNext separate SQL reads for cohorts, unassigned, eligibility, journey, last decision.

## G2-13-029-029  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:95-120`
- vNext now: `src/modules/placements/tpo-batch-workspace-read-service.ts:14-25`
- Fix: Legacy session gets batch list via BatchesService; vNext persisted active TPO/COLLEGE_ADMIN membership with scoped placements.manage and college restriction.

## G2-13-029-031  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:145-146`
- vNext now: `src/modules/placements/tpo-batch-workspace-read-service.ts:62-78`
- Fix: Legacy outside batches count checks learners not in a class; vNext counts classless active membership separately and guards visibility.

## G2-13-029-053  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:18-21`
- vNext now: `src/modules/placements/tpo-batch-workspace-read-service.ts:27-40`
- Fix: Legacy BatchesService/eligibility undo API vs PostgreSQL cohorts, placement_batch_lifecycles and decisions/events; different provider/permissions.

## G2-6-023-041  [P2] GAP  facet F13  effort S
- Legacy: Legacy missing college error Choose a college (TpoBatchesController.java:32-35).
- vNext now: vNext returns action not available/ready flag for incomplete DB migration (tpo-batch-rules-service.ts:8-12; tpo-batch-workspace-read-service.ts:106).
- Fix: Separate insufficient permission from migration readiness and present actionable retry.
