# Work packet (wave 2): edit src/modules/placements/bulk-drive-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/tpo-applicant-controller.md

## G2-8-023-066  [P2] GAP  facet F21  effort M
- Legacy: Legacy NotificationOutboxService queues status and applied-on-behalf events (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:42-46,140-147; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveAddService.java:121-133).
- vNext now: New direct in-app notifications/activity events and prospective SMS absent from reviewed applicant service (src/modules/placements/tpo-bulk-action-confirm-service.ts:97-115; src/modules/placements/bulk-drive-service.ts:314-350).
- Fix: Map outbox dispatch timing to new notification delivery and retries.
