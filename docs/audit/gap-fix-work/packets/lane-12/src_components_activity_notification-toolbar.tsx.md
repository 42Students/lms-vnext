# Work packet: edit src/components/activity/notification-toolbar.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/notification.md

## G2-8-018-003  [P1] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:36-48,517-548: learner category tabs Course/Project/Announcements/Job; faculty College/Department/Faculty/Personal
- vNext now: src/components/activity/notification-toolbar.tsx:53-69: All and Unread only
- Fix: Restore role-category navigation and category-specific counts.

## G2-8-018-016  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:134-154,517-575: role-specific tabs and newest-by-date sorting
- vNext now: src/components/activity/notification-toolbar.tsx:53-69, src/modules/activity/notification-service.ts:521-525: unread filter, timestamp/id sort
- Fix: Preserve category filters; use deterministic timestamp+ID sort.

## G2-8-018-029  [P2] GAP  facet F08  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:216-228: “Notification deleted successfully”
- vNext now: src/components/activity/notification-toolbar.tsx:35-48: “Marked all as read” new success toast
- Fix: Restore delete success only in authorized staff-management context.
