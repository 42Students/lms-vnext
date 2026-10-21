# Work packet (wave 2): edit src/app/api/placements/tpo/batches/[batchId]/rules/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/tpo-batches-controller.md

## G2-6-023-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy GET /batches/{batchId}, /students, /rules (TpoBatchesController.java:43-61).
- vNext now: vNext separate getTpoBatch and rules POST API (tpo-batch-workspace-read-service.ts:41-120; batches/[batchId]/rules/route.ts:8-17).
- Fix: Document GET routes and state payload contract; ensure direct deep links and back navigation.
