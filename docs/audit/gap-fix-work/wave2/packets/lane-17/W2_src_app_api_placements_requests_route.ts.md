# Work packet (wave 2): edit src/app/api/placements/requests/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l14-u023-learner-request-controller.md

## G2-14-023-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRequestController.java:15-17,40-55 — POST /api/v1/learner/requests and GET /mine.
- vNext now: src/app/api/placements/requests/route.ts:9-32 — POST /api/placements/requests; own history via page service, no GET /mine route.
- Fix: Map legacy create and mine endpoints to new API/navigation.

## G2-14-023-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRequestController.java:14,29-38 — one learner placement request endpoint for seven kinds.
- vNext now: src/app/api/placements/requests/route.ts:5-26 plus src/modules/placements/tpo-general-request-service.ts:91-145 — split job request and general request workflows.
- Fix: Expose unified learner request entry and history across request types.
