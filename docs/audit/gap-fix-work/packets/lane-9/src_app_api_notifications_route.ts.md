# Work packet: edit src/app/api/notifications/route.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l12-u013-notification-search.md

## G2-12-013-001  [P1] GAP  facet F01  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/notifications/NotificationSearchController.java:18-42: GET /api/v2/notifications/search.
- vNext now: src/app/api/notifications/route.ts:8-38: GET /api/notifications returns own notifications, no title/message search.
- Fix: Expose scoped text search equivalent with typed q and tenant constraints.

## G2-12-013-004  [P1] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/notifications/NotificationSearchController.java:41-46: query/limit/classId/courseId params.
- vNext now: src/app/api/notifications/route.ts:16-29: unreadOnly and limit; no class/course text search params.
- Fix: Support old query/scope parameters or link to module-specific inbox.

## G2-12-013-015  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/notifications/NotificationSearchController.java:54,58: 'classId must be >= 1', 'courseId must be >= 1'.
- vNext now: src/app/api/notifications/route.ts:16-29: no class/course accepted.
- Fix: Restore class/course parameter errors or documented removal.

## G2-12-013-016  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/notifications/NotificationSearchController.java:62: 'Provide either classId or courseId, not both'.
- vNext now: src/app/api/notifications/route.ts:16-29: no mutual exclusion because params absent.
- Fix: Enforce exclusive filters on any replacement.

## G2-12-013-014  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/notifications/NotificationSearchController.java:50: 'limit must be >= 1'.
- vNext now: src/app/api/notifications/route.ts:34-36: generic apiErrorResponse; no exact validation error copy.
- Fix: Preserve explicit validation feedback.

## G2-12-013-018  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/notifications/NotificationSearchController.java:106: JSON 'Notifications retrieved'.
- vNext now: src/app/api/notifications/route.ts:31-33: JSON {notifications} with no success wrapper.
- Fix: Update API consumers or provide adapter for legacy response shape.
