# Work packet (wave 2): edit src/modules/activity/tpo-notifications-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l11-u018-tpo-notifications.md

## G2-11-018-012  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/notifications.js:15-18 starts window50, grows 50 until200, newest-first, olderUnread count.
- vNext now: src/modules/activity/tpo-notifications-service.ts:77-84 listOwnNotificationPage limit50 with beforeCreatedAt/Id, src/app/(authenticated)/tpo/notifications/page.tsx:70-73 cursor replaces page content.
- Fix: Provide append-view 'Show older' or clearly indicate paging behavior and total unread.

## G2-11-018-024  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/notifications.js:40-47 calls getBell(limit) + getCounts in parallel (GET /api/v1/tpo/bell, counts).
- vNext now: src/modules/activity/tpo-notifications-service.ts:74-109 GET DB notification page/count via server reads, separate /api/tpo/notifications route for actions.
- Fix: Preserve count source semantics and stale/error distinctions across partial reads.

## G2-11-018-044  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoWorkspaceController.java:~245-281 old TPO Bell stores recipient userType/id, createdAt, readAt and link.
- vNext now: src/modules/activity/tpo-notifications-service.ts:80-109 uses inAppNotifications joined to activityEvents scoped college; src/db/schema/activity.ts:126-169 includes readAt,actionHref,createdAt.
- Fix: Document mapping of old bell ids/links/userType to vNext UUID event FK and new scope policy.
