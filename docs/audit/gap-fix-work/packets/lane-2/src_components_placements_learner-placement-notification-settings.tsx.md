# Work packet: edit src/components/placements/learner-placement-notification-settings.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/job-preferences-repository.md

## G2-4-015-028  [P2] GAP  facet F08  effort S
- Legacy: Legacy GET message Success, PUT message Updated successfully. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerProfileController.java:1177-1199`)
- vNext now: New PUT returns preferences JSON and toast Placement notification choices saved. (`src/app/api/placements/preferences/notifications/route.ts:9-20`; `src/components/placements/learner-placement-notification-settings.tsx:38-49`)
- Fix: Match success envelope/copy for remaining old call sites.
