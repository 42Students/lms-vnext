# Work packet: edit src/modules/people/learner-profile-data-access-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/learner-placement-profile-controller.md

## G2-1-009-031  [P1] GAP  facet F10  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/LearnerPlacementProfileService.java:44-55`: dataAccessLog joins share links/jobs/applications/events; no mutation.
- vNext now: `src/modules/people/learner-profile-data-access-service.ts:14-22`: queries activityEvents instead, no share relation.
- Fix: Read actual share links and download events; do not substitute activity log.

## G2-1-009-034  [P1] GAP  facet F11  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/LearnerPlacementProfileService.java:44-55`: share visibility keyed learner_id of applied jobs; not scoped by college in SELECT.
- vNext now: `src/modules/people/learner-profile-data-access-service.ts:18-22`: active college+membership scoped activity history.
- Fix: Scope third-party share disclosure to all legitimately relevant past participation without tenant leakage.
