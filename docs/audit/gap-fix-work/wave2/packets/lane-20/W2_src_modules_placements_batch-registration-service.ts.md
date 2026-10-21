# Work packet (wave 2): edit src/modules/placements/batch-registration-service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u023-learner-placement-controller.md, docs/audit/gap2/lane-5/l15-u023-learner-registration-controller.md

## G2-16-023-017  [P2] GAP  facet F06  effort S
- Legacy: LearnerPlacementController.java:45-50 RegisterRequest choice/consent.
- vNext now: batch-registration-service.ts:27-30 strict acceptedConsent instead of consent.
- Fix: Map legacy request consent field for compatible clients.

## G2-16-023-020  [P2] GAP  facet F06  effort L
- Legacy: LearnerPlacementService.java:57-64 registration per season, batch window.
- vNext now: batch-registration-service.ts:44-54 registration per cohort and locked college.
- Fix: Retain batch-specific invitation/deadline/eligibility and explicitly map season deprecation.

## G2-16-023-054  [P2] GAP  facet F22  effort M
- Legacy: LearnerPlacementController.java:45-50 register self by learnerId/int+season ID.
- vNext now: batch-registration-service.ts:44-54 cohort/member UUID registration with audit events.
- Fix: Document ID/cohort/consent timestamp mapping without data migration if intentionally waived.

## G2-15-023-013  [P2] GAP  facet F06  effort M
- Legacy: Legacy POST request parameters choice, consent(default=false). `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRegistrationController.java:42-43`
- vNext now: vNext strict JSON choice,acceptedConsent required boolean. `src/modules/placements/batch-registration-service.ts:27-30`, `src/components/placements/learner-placement-registration.tsx:38-42`
- Fix: Support old form-urlencoded clients or migrate all.

## G2-15-023-038  [P2] GAP  facet F15  effort M
- Legacy: Legacy TPO invite sends registration-open in-app notices outside controller. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/BatchRegistrationService.java:101-124`
- vNext now: vNext self register writes DB row, no notification in service itself. `src/modules/placements/batch-registration-service.ts:189-228`
- Fix: Verify invitation notice parity in TPO batch service.

## G2-15-023-050  [P2] GAP  facet F21  effort M
- Legacy: Legacy Spring JPA PlacementRegistrationRepository. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoStudentService.java:31-45`
- vNext now: vNext Drizzle PG with transaction and SQL event trigger. `src/modules/placements/batch-registration-service.ts:73-228`
- Fix: Map persistence adapter and source attribution.
