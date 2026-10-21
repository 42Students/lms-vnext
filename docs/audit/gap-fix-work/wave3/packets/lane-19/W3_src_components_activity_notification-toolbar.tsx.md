# Work packet (wave 3): edit src/components/activity/notification-toolbar.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/teacher-notifications.md

## G2-6-008-018  [P1] MISSING  facet F05  effort L
- Legacy: Old `tab` filters college/department/faculty/personal categories by receiverType `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:144-154` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:569-575`
- vNext now: New `view` supports all/unread only and announcements not filterable `src/app/(authenticated)/teacher/notifications/page.tsx:35-45` `src/components/activity/notification-toolbar.tsx:54-68`
- Fix: Implement scope-category filter with counts and optional unread control
