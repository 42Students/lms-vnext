# Work packet: edit src/modules/placements/learner-registration-read-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l15-u023-learner-registration-controller.md

## G2-15-023-002  [P1] GAP  facet F01  effort M
- Legacy: Legacy GET mine current season registration, 204 when none. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRegistrationController.java:33-40`
- vNext now: vNext current academic cohort registration display with stage, no 204 concept. `src/modules/placements/learner-registration-read-service.ts:15-37`
- Fix: Preserve no-registration semantics and season/cohort mapping.

## G2-15-023-011  [P1] GAP  facet F05  effort M
- Legacy: Legacy registration reads current placement season. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRegistrationController.java:33-40`
- vNext now: vNext requires exactly one active program enrollment and current cohort. `src/modules/placements/learner-registration-read-service.ts:15-29`
- Fix: Define rollover on new cohort/season.

## G2-15-023-024  [P1] GAP  facet F10  effort M
- Legacy: Legacy GET queries season.current then learner-season uniqueness. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRegistrationController.java:35-39`
- vNext now: vNext scoped learner/cohort DB lookup plus window status. `src/modules/placements/learner-registration-read-service.ts:12-37`
- Fix: Validate historical seasons vs academic cohorts.

## G2-15-023-020  [P2] GAP  facet F08  effort M
- Legacy: Legacy GET 200 row or 204. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRegistrationController.java:33-40`
- vNext now: vNext display always includes stage/choice. `src/modules/placements/learner-registration-read-service.ts:12-37`
- Fix: Represent empty choice clearly.
