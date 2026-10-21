# Work packet: edit src/app/api/placements/requests/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l14-u023-learner-request-controller.md

## G2-14-023-020  [P2] GAP  facet F08  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRequestController.java:48-49 — creation returns 201 with StudentRequest object.
- vNext now: src/app/api/placements/requests/route.ts:24-27 — creation 201 {request: placementRequest} envelope.
- Fix: Preserve client acknowledgement/serialization shape.
