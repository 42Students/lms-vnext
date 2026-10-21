# Work packet (wave 2): edit src/app/(authenticated)/notifications/page.tsx

22 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l12-u013-notification-search.md, docs/audit/gap2/lane-8/notification.md

## G2-12-013-002  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/notifications/NotificationSearchController.java:109-123: superadmin stats and refresh endpoints.
- vNext now: src/app/(authenticated)/notifications/page.tsx:13-97: authenticated inbox page, no stats/refresh buttons.
- Fix: Provide authorized admin cache/stat controls or document removal.

## G2-12-013-005  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/notifications/NotificationSearchController.java:115: totalNotifications count admin stat.
- vNext now: src/app/(authenticated)/notifications/page.tsx:33-34: unreadCount only; no total cache size.
- Fix: Expose global count to superadmin under permissions.

## G2-12-013-006  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/notifications/NotificationSearchDTO.java:17-28: id title message classId courseId courseSlug, learner/schedule internal hidden.
- vNext now: src/app/(authenticated)/notifications/page.tsx:43-62: id title body actionHref readAt createdAt module importance.
- Fix: Map class/course deep link fields, preserve title/message.

## G2-12-013-028  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/notifications/NotificationSearchCache.java:26-31: @PostConstruct cache init; errors logged and cache can stay empty.
- vNext now: src/app/(authenticated)/notifications/page.tsx:25-34: server DB read; no distinction empty vs data failure in this page.
- Fix: Distinguish backend failure from genuinely empty inbox.

## G2-12-013-040  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/notifications/NotificationSearchDTO.java:17-28: Notification id Integer, classId/courseId Integer, courseSlug String.
- vNext now: src/app/(authenticated)/notifications/page.tsx:43-62: inAppNotifications UUID, actionHref/readAt/importance.
- Fix: Provide data crosswalk and retired class/course scope mapping.

## G2-8-018-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/learn/notifications.js:1-6, docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:327-336: shared learner/faculty notification page
- vNext now: src/app/(authenticated)/notifications/page.tsx:13-20: global Notifications page
- Fix: Preserve role-specific /learn and /teacher notification entry aliases.

## G2-8-018-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:613-659: page header, filter pills then floating list
- vNext now: src/app/(authenticated)/notifications/page.tsx:65-85: PageHeader, unread toolbar, date-grouped list
- Fix: Match legacy section order and category tabs; retain date grouping only as addition.

## G2-8-018-011  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/NotificationResponseDTO.java:13-15,72-78: created_at [year, zero-indexed month, day]
- vNext now: src/app/(authenticated)/notifications/page.tsx:55-59: ISO datetime
- Fix: Preserve incoming date-array support and timezone/display format.

## G2-8-018-013  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Notification.java:55-59: courseSlug/courseName resolved in response
- vNext now: src/app/(authenticated)/notifications/page.tsx:43-63: only module name, not course
- Fix: Resolve course context in bulk and render legacy fallback labels.

## G2-8-018-017  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:379-410,420-463: fetches multiple class and faculty pages for complete counts
- vNext now: src/app/(authenticated)/notifications/page.tsx:25-33: 50-item cursor page
- Fix: Compute category counts server-side across full accessible feed.

## G2-8-018-038  [P2] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:238-269: SSE subscribe /classId with connection limits
- vNext now: src/app/(authenticated)/notifications/page.tsx:13-34: server-side pull-only
- Fix: Restore live updates with bounded connections or record intentional loss.

## G2-8-018-050  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:683-711: three skeleton cards, last-good results retained
- vNext now: src/app/(authenticated)/notifications/page.tsx:13-34: server-rendered cursor list
- Fix: Match loading skeleton and non-destructive refresh error path.

## G2-8-018-051  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:577-585: “No notifications yet” illustration/subtitle
- vNext now: src/app/(authenticated)/notifications/page.tsx:81-85: “Nothing yet” / “No unread notifications.”
- Fix: Restore exact text and illustration.

## G2-8-018-052  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:593-606: “Couldn't load notifications” and Retry
- vNext now: src/app/(authenticated)/notifications/page.tsx:25-34: local error fallback not visible on page
- Fix: Provide retryable local error state with exact legacy wording.

## G2-8-018-053  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:691-700: “No <category> notifications yet”
- vNext now: src/app/(authenticated)/notifications/page.tsx:81-85: only unread/total empties
- Fix: Restore category-specific empty card and All action.

## G2-8-018-062  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:577-585,691-700: “No notifications yet” / “No Job notifications yet”
- vNext now: src/app/(authenticated)/notifications/page.tsx:83-84: “Nothing yet.” / “No unread notifications.”
- Fix: Use legacy empty copy by selected category.

## G2-8-018-065  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:664-681: partial refresh error copy
- vNext now: src/app/(authenticated)/notifications/page.tsx:25-34: no on-page partial-source error
- Fix: Restore “Couldn't refresh notifications” and retry.

## G2-8-018-067  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:271-303: class default100, max500, paged faculty recipient
- vNext now: src/app/(authenticated)/notifications/page.tsx:25-33: 50 per cursor
- Fix: Support complete category counts without materializing every record in UI.

## G2-8-018-068  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:345-365: batch-load courses to avoid N+1
- vNext now: src/app/(authenticated)/notifications/page.tsx:43-63: no course metadata lookup
- Fix: Batch join relevant course names when rendering context.

## G2-8-018-071  [P2] GAP  facet F20  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:260-269: SSE 3 connections/user and 3000/class cap
- vNext now: src/app/(authenticated)/notifications/page.tsx:13-95: no SSE registration
- Fix: Add bounded live update with reconnect and 429 fallback if parity required.

## G2-8-018-075  [P2] GAP  facet F21  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:238-269: class SSE subscription
- vNext now: src/app/(authenticated)/notifications/page.tsx:13-95: navigational server pull
- Fix: Implement live events or document read freshness loss.

## G2-8-018-089  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Notification.java:17: JSON response snake_case
- vNext now: src/app/(authenticated)/notifications/page.tsx:43-63: camelCase frontend props
- Fix: Provide adapter for legacy mobile/external clients.
