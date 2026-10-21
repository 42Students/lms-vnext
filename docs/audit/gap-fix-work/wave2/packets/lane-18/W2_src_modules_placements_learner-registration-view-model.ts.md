# Work packet (wave 2): edit src/modules/placements/learner-registration-view-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l15-u023-learner-registration-controller.md

## G2-15-023-010  [P2] GAP  facet F04  effort M
- Legacy: Legacy GET raw PlacementRegistration JSON or no content. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRegistrationController.java:33-40`
- vNext now: vNext returns choice plus status/deadline projection. `src/modules/placements/learner-registration-view-model.ts:20-31`, `src/modules/placements/learner-registration-read-service.ts:22-37`
- Fix: Document changed response envelope and field naming.

## G2-15-023-043  [P2] GAP  facet F18  effort M
- Legacy: Legacy three literal options, consent not described in controller. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRegistrationController.java:11-14`
- vNext now: vNext has detailed hints and consent/deadline copy. `src/modules/placements/learner-registration-view-model.ts:2-19`
- Fix: Audit original placements-page exact wording.
