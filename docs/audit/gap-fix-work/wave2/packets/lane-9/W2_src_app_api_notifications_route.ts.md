# Work packet (wave 2): edit src/app/api/notifications/route.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l12-u013-notification-search.md

## G2-12-013-012  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/notifications/NotificationSearchController.java:43-46: optional query empty, limit15, optional positive class/course IDs.
- vNext now: src/app/api/notifications/route.ts:17-21: unreadOnly string true, limit40; different defaults.
- Fix: Restore equivalent parameter behavior for v2 compatibility.

## G2-12-013-022  [P2] MISSING  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/notifications/NotificationSearchController.java:118-123: POST /refresh calls cache.refresh.
- vNext now: src/app/api/notifications/route.ts:8-38: GET only, no refresh mutation.
- Fix: Add superadmin cache refresh only if search cache retained.

## G2-12-013-023  [P2] GAP  facet F11  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/notifications/NotificationSearchController.java:64-79: global superadmin can global search, others must have class/course access.
- vNext now: src/app/api/notifications/route.ts:12-29: getCurrentRequestContext and own notification service.
- Fix: If global discovery needed, implement explicit superadmin-only view.

## G2-12-013-026  [P3] GAP  facet F12  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/notifications/NotificationSearchController.java:81: cappedLimit min(limit,200), cache candidate fetch 4x.
- vNext now: src/app/api/notifications/route.ts:20-29: default40, N:26 limit60, P:29 limit50.
- Fix: Document distinct page vs search limits.

## G2-12-013-034  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/notifications/NotificationSearchController.java:106,115,123: exact 'Notifications retrieved', 'Stats retrieved', 'Cache refreshed'.
- vNext now: src/app/api/notifications/route.ts:31-33: unwrapped JSON, no messages.
- Fix: Align adapter response copy if public callers rely on it.
