# Work packet (wave 3): edit src/app/(authenticated)/teacher/notifications/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/teacher-notifications.md

## G2-6-008-018  [P1] MISSING  facet F05  effort L
- Legacy: Old `tab` filters college/department/faculty/personal categories by receiverType `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:144-154` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:569-575`
- vNext now: New `view` supports all/unread only and announcements not filterable `src/app/(authenticated)/teacher/notifications/page.tsx:35-45` `src/components/activity/notification-toolbar.tsx:54-68`
- Fix: Implement scope-category filter with counts and optional unread control

## G2-6-008-026  [P1] MISSING  facet F07  effort L
- Legacy: Old partial personal load warning exact `Some notifications could not be loaded` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:467-475` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:673-681`
- vNext now: New both reads in Promise.all, no partial warning when one fails `src/app/(authenticated)/teacher/notifications/page.tsx:37-50`
- Fix: Use Promise.allSettled with explicit source failure banner and retry

## G2-6-008-047  [P1] MISSING  facet F13  effort L
- Legacy: Old partial personal failure doesn't discard college announcements `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:458-475`
- vNext now: New Promise.all means any rejected source blocks both `src/app/(authenticated)/teacher/notifications/page.tsx:37-50`
- Fix: Isolate source reads, serve available source even on one failure
