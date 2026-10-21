# Work packet: edit src/modules/activity/learner-notification-read-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/cross-notifications.md, docs/audit/gap2/lane-18/notification-service.md

## G2-4-032-015  [P1] GAP  facet F05  effort M
- Legacy: Get by class, course or recipient (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:125-175`)
- vNext now: Learner read only for own user and selected college (`src/modules/activity/learner-notification-read-service.ts:15-39`)
- Fix: Provide class/course public staff views without cross-student leakage.

## G2-4-032-025  [P2] MISSING  facet F08  effort M
- Legacy: Delete returns `Notification deleted successfully` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:214-228`)
- vNext now: Own unread/read mutation no deletion flow (`src/modules/activity/learner-notification-read-service.ts:15-39`)
- Fix: Restore delete/archival feedback if actor-owned deletions permitted.

## G2-4-032-026  [P2] MISSING  facet F08  effort M
- Legacy: Delete alias returns `Deleted notification successfully` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:272-286`)
- vNext now: No delete-notification alias (`src/modules/activity/learner-notification-read-service.ts:15-39`)
- Fix: Add compatibility alias or retire old wording with migrated UI.

## G2-18-012-023  [P3] GAP  facet F08  effort S
- Legacy: Legacy missing update id error `Notification not found with id N` (`NotificationServiceImpl.java:216-234`).
- vNext now: New own-read not-found uses NOTIFICATION_NOT_FOUND error code (`learner-notification-read-service.ts:19-32`).
- Fix: Map error to safe own-recipient copy, never disclose another person's ID.
