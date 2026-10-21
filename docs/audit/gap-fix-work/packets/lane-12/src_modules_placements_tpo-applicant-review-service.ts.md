# Work packet: edit src/modules/placements/tpo-applicant-review-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/tpo-applicant-controller.md

## G2-8-023-036  [P1] GAP  facet F10  effort M
- Legacy: Legacy bulk transitions update JobApplication status and status history, enqueue held notice for Undo (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:115-151).
- vNext now: New stage action writes placementTpoApplicationStages and activity, review writes screening separately (src/modules/placements/tpo-bulk-application-stage-service.ts:105-132; src/modules/placements/tpo-applicant-review-service.ts:12-40).
- Fix: Define canonical status machine and projection across application, screening, round and pipeline.
