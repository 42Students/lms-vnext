# Work packet: edit src/modules/placements/learner-offer-action-error-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/l17-u023-learner-offer-controller.md

## G2-17-023-021  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerOfferController.java:44-46 IllegalStateException 409 response {error: message}
- vNext now: src/modules/placements/learner-offer-action-error-model.ts:3-8 generic friendly 409/410/422 and no server text
- Fix: Map known expired/conflict messages without leaking internal stack or tenant details.

## G2-17-023-022  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerOfferController.java:49-51 IllegalArgumentException 404 response {error: message}
- vNext now: src/modules/placements/learner-offer-action-error-model.ts:6-8 404 uses generic account restriction toast
- Fix: Differentiate missing offer vs unauthorized using safe source-coded error.

## G2-17-023-024  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:173-175 'This offer can no longer be responded to (current status: ...)'
- vNext now: src/modules/placements/learner-offer-action-error-model.ts:4-8 'This offer may have changed or expired...'
- Fix: Display safe current status code/name and reload hint.
