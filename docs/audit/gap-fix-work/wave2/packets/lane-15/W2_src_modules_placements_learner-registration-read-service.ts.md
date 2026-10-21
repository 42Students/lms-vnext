# Work packet (wave 2): edit src/modules/placements/learner-registration-read-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l15-u023-learner-registration-controller.md

## G2-15-023-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy learner /api/v1/learner/registration own card GET/POST. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRegistrationController.java:11-14,33-53`
- vNext now: vNext learner Placement section + /api/placements/registration JSON POST. `src/components/placements/learner-placement-registration.tsx:31-42`, `src/modules/placements/learner-registration-read-service.ts:12-37`
- Fix: Map old endpoint to current page/read/write routes.

## G2-15-023-010  [P2] GAP  facet F04  effort M
- Legacy: Legacy GET raw PlacementRegistration JSON or no content. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRegistrationController.java:33-40`
- vNext now: vNext returns choice plus status/deadline projection. `src/modules/placements/learner-registration-view-model.ts:20-31`, `src/modules/placements/learner-registration-read-service.ts:22-37`
- Fix: Document changed response envelope and field naming.

## G2-15-023-035  [P2] GAP  facet F13  effort M
- Legacy: Legacy no current season may throw via seasonService.current. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRegistrationController.java:33-39`
- vNext now: vNext invalid multiple/zero enrollment throws typed error. `src/modules/placements/learner-registration-read-service.ts:15-21`
- Fix: Show helpful no-batch or no-season state.
