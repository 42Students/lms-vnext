# Work packet: edit src/app/api/college/batches/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/batch-controller.md

## G2-2-029-041  [P2] GAP  facet F08  effort S
- Legacy: BatchController.java:87-91 create returns HTTP 201 BatchResponseDTO directly.
- vNext now: college/batches/route.ts:18-19 returns 201 `{cohort}`.
- Fix: Normalize response to predictable success envelope.
