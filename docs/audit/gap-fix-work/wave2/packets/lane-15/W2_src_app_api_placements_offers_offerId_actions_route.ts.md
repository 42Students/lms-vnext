# Work packet (wave 2): edit src/app/api/placements/offers/[offerId]/actions/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/learner-offers.md, docs/audit/gap2/lane-9/l17-u023-learner-offer-controller.md

## G2-13-005-041  [P2] GAP  facet F10  effort M
- Legacy: POST `/api/v1/learner/offers/{offerId}/respond` body {accept:boolean} (`docs/legacy-source/frontend/src/api/Services/TpoHubService.js:174-174`)
- vNext now: POST `/api/placements/offers/{offerId}/actions` action ACCEPT/DECLINE (`src/app/api/placements/offers/[offerId]/actions/route.ts:15-37`)
- Fix: Keep legacy accepted/declined semantics via validated action adapter.

## G2-17-023-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerOfferController.java:20-33 POST /api/v1/learner/offers/:id/respond accepts boolean
- vNext now: src/app/api/placements/offers/[offerId]/actions/route.ts:15-38 POST /api/placements/offers/:id/actions accepts discriminated action
- Fix: Map legacy boolean respond to ACCEPT/DECLINE while keeping same-origin and UUID validation.
