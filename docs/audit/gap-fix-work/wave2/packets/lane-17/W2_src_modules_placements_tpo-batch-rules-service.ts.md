# Work packet (wave 2): edit src/modules/placements/tpo-batch-rules-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/tpo-batches-controller.md

## G2-6-023-014  [P2] GAP  facet F06  effort M
- Legacy: Legacy batch rules PUT accepts nullable four overrides; {} clears to college defaults (TpoBatchesController.java:63-69).
- vNext now: vNext save POST requires rulesOverride object and expectedVersion, empty object becomes null (tpo-batch-rules-model.ts:3-13; tpo-batch-rules-service.ts:8-18).
- Fix: Adapt empty payload and make version precondition explicit; retain clear-inheritance behavior.

## G2-6-023-040  [P2] GAP  facet F12  effort M
- Legacy: Legacy rules inheritance four override fields and job type placed statuses (TpoBatchesController.java:63-81).
- vNext now: vNext strict four-field schema but effective result not in save response (tpo-batch-rules-model.ts:3-13; tpo-batch-rules-service.ts:8-18).
- Fix: Compute inherited and effective policy/placed status at read time.
