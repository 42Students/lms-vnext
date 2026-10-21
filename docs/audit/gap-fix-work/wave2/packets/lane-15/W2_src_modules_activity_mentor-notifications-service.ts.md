# Work packet (wave 2): edit src/modules/activity/mentor-notifications-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/cross-notifications.md, docs/audit/gap2/lane-7/u026-mentor-notifications.md

## G2-4-032-055  [P2] GAP  facet F16  effort M
- Legacy: SSE per-class connection supports multiple active learners (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:244-268`)
- vNext now: New mentor inbox is paginated and specific to selected college (`src/modules/activity/mentor-notifications-service.ts:45-64`)
- Fix: Compare notification bell mobile menu and active refresh across roles.

## G2-7-026-024  [P2] GAP  facet F05  effort M
- Legacy: notifications.js:180-233 loads ALL announcements and personal notifications with 100-row pages loop
- vNext now: mentor-notifications-service.ts:45-64 personal cursor pages of 50, announcements fetched separately
- Fix: Document pagination behavior; ensure old notices discoverable via Older

## G2-7-026-043  [P2] GAP  facet F10  effort L
- Legacy: UserServices.js:55-64 GET getNotificationsForRecipient recipientId+pagination
- vNext now: mentor-notifications-service.ts:45-64 owner-only cursor read of inAppNotifications
- Fix: Verify receiver-type and recipient ID mapping; preserve old notifications through migration

## G2-7-026-077  [P2] GAP  facet F19  effort M
- Legacy: notifications.js:180-214 paginated API requests loop to retrieve all notifications 100 per call
- vNext now: mentor-notifications-service.ts:45-64 limits personal inbox to 50 cursor rows
- Fix: Confirm older notices reachable, disclose paging and avoid unbounded load
