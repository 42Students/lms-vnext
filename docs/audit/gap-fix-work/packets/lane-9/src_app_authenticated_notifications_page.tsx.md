# Work packet: edit src/app/(authenticated)/notifications/page.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l12-u013-notification-search.md, docs/audit/gap2/lane-8/notification.md

## G2-12-013-010  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/notifications/NotificationSearchController.java:93-105: one of classId or courseId, default global superadmin allowed.
- vNext now: src/app/(authenticated)/notifications/page.tsx:19-34: filter all/unread and cursor, no class/course.
- Fix: Add scoped class/course filter if legacy workflow still needed.

## G2-8-018-010  [P1] GAP  facet F04  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/NotificationResponseDTO.java:19-38: class/course/recipient IDs and application/job/assessment/interview context
- vNext now: src/app/(authenticated)/notifications/page.tsx:43-63: title/body/actionHref/readAt/module/importance only
- Fix: Add typed target metadata or safe target-link transformation for every legacy resource.

## G2-8-018-019  [P1] GAP  facet F05  effort L
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:228-253,569-575: merged announcements and notifications, source-tagged IDs
- vNext now: src/app/(authenticated)/notifications/page.tsx:25-63: event-derived in-app notifications only
- Fix: Join authorized announcements and personal notices; disambiguate IDs by source.

## G2-8-018-094  [P1] GAP  facet F23  effort L
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:205-225,228-253: merges announcements feed with notifications
- vNext now: src/app/(authenticated)/notifications/page.tsx:25-63: activity inbox separated from admin announcements
- Fix: Restore merged role feed with source-typed stable keys.

## G2-8-018-031  [P2] GAP  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:646-681: retry and partial source failure banners
- vNext now: src/app/(authenticated)/notifications/page.tsx:25-34: combined read but no source-partial warning
- Fix: Preserve last good results and display partial-failure retry.

## G2-12-013-019  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/notifications/NotificationSearchController.java:115: JSON 'Stats retrieved'; 123 'Cache refreshed'.
- vNext now: src/app/(authenticated)/notifications/page.tsx:13-97: no equivalent success notice.
- Fix: Add admin-only feedback if stats/refresh retained.
