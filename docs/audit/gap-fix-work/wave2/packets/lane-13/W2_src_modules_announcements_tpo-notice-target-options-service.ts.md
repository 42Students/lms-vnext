# Work packet (wave 2): edit src/modules/announcements/tpo-notice-target-options-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l12-u023-tpo-announcement-controller.md

## G2-12-023-018  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:84-96`
- vNext now: `src/modules/announcements/tpo-notice-target-options-service.ts:13-41`
- Fix: Legacy drive options include PUBLISHED and CLOSED, capped 60; vNext target options include PUBLISHED only and independently scoped batches/branches.

## G2-12-023-068  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:95-108`
- vNext now: `src/modules/announcements/tpo-notice-target-options-service.ts:13-41`
- Fix: Legacy emailReady false and no actual email/SMS provider; vNext does not send external mail and uses notification scheduler.
