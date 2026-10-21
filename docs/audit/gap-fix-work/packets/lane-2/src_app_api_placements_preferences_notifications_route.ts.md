# Work packet: edit src/app/api/placements/preferences/notifications/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/job-preferences-repository.md

## G2-4-015-001  [P1] GAP  facet F01  effort L
- Legacy: Legacy GET/PUT learnerId/job-preferences reads and updates one JobPreferences row. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerProfileController.java:1177-1202`)
- vNext now: New learner profile edit plus separate Placement notifications PUT. (`src/modules/people/learner-profile-document-edit-service.ts:13-45`; `src/app/api/placements/preferences/notifications/route.ts:9-20`)
- Fix: Define complete contract adapter or migrate each old caller to both services.

## G2-4-015-028  [P2] GAP  facet F08  effort S
- Legacy: Legacy GET message Success, PUT message Updated successfully. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerProfileController.java:1177-1199`)
- vNext now: New PUT returns preferences JSON and toast Placement notification choices saved. (`src/app/api/placements/preferences/notifications/route.ts:9-20`; `src/components/placements/learner-placement-notification-settings.tsx:38-49`)
- Fix: Match success envelope/copy for remaining old call sites.
