# Work packet (wave 3): edit src/modules/people/learner-profile-data-access-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/learner-placement-profile-controller.md

## G2-1-009-019  [P1] MISSING  facet F04  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/LearnerPlacementProfileService.java:45-55`: company,role,sharedWithEmail,sharedAt,downloadedAt named fields.
- vNext now: `src/modules/people/learner-profile-data-access-service.ts:14-22`: activity summary/eventType/occurredAt only, no share projection.
- Fix: Provide typed share disclosure DTO with all five fields and safe visibility.
