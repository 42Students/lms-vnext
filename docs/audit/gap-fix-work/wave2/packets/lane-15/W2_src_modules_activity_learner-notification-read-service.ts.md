# Work packet (wave 2): edit src/modules/activity/learner-notification-read-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/cross-notifications.md

## G2-4-032-019  [P2] GAP  facet F06  effort M
- Legacy: SSE subscribe requires classId >=1 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:244-268`)
- vNext now: New read mutation uses UUID notification ID and college membership (`src/modules/activity/learner-notification-read-service.ts:15-39`)
- Fix: Map old class-based subscription to per-user inbox connection.

## G2-4-032-061  [P2] MISSING  facet F18  effort M
- Legacy: Delete success `Notification deleted successfully` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:215-228`)
- vNext now: Read service has no delete messages (`src/modules/activity/learner-notification-read-service.ts:15-39`)
- Fix: Restore delete copy if feature retained.
