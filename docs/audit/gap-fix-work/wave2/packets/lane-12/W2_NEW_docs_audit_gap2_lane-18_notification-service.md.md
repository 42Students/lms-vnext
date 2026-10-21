# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-18/notification-service.md

5 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-18/notification-service.md

## G2-18-012-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy list APIs are class/course scoped, with optional learner; other recipient feed crosses classes (`NotificationService.java:25-57`).
- vNext now: New `/api/notifications` lists only authenticated user and filter unread/limit (`notifications/route.ts:8-37`).
- Fix: Preserve class/course-context views using own-recipient links while retaining tenant guard.

## G2-18-012-012  [P2] GAP  facet F05  effort M
- Legacy: Legacy admin list pageSize clamps1–200 (`NotificationServiceImpl.java:175-191`).
- vNext now: New notification own inbox uses default40 and unreadOnly, no admin paging (`notifications/route.ts:17-29`).
- Fix: Implement admin pageSize options and scoped server paging when adding admin directory.

## G2-18-012-013  [P2] GAP  facet F05  effort M
- Legacy: Legacy class+course filter selects targeted course and person (`NotificationService.java:25-50`).
- vNext now: New own inbox only unread filter, no course filter (`notifications/route.ts:17-29`).
- Fix: Offer optional course-context filter with permission-aware event metadata.

## G2-18-012-025  [P2] GAP  facet F09  effort M
- Legacy: Legacy update/delete may be triggered through admin composer with recipient scope (`NotificationService.java:29-31`).
- vNext now: New has no global update/delete route in mapped notification endpoint (`notifications/route.ts:8-37`).
- Fix: Restore permissioned editor/discard/delete confirmation under admin notification UI.

## G2-18-012-054  [P2] MISSING  facet F20  effort M
- Legacy: Legacy edit/delete broadcasts updated/deleted event to class SSE (`NotificationServiceImpl.java:216-252`).
- vNext now: New notification event isn't editable/deletable via mapped own API (`notifications/route.ts:8-37`).
- Fix: Implement safe recall/update event and recipient stale-UI invalidation.
