# Work packet (wave 3): edit src/app/api/notifications/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/l17-u026-notification-controller.md

## G2-17-026-062  [P1] MISSING  facet F21  effort L
- Legacy: docs/legacy-source/frontend/src/hooks/useNotificationFeed.js:74-139 EventSource shared learner feed refreshes on events
- vNext now: src/app/api/notifications/route.ts:8-37 no EventSource integration endpoint
- Fix: Wire live transport to shared header, footer and inbox; prohibit query-string bearer tokens

## G2-17-026-066  [P1] MISSING  facet F23  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:88-105 admin fetchAll, 179-293 CRUD and SSE exist in legacy
- vNext now: src/app/api/notifications/route.ts:8-37 GET self-feed only
- Fix: Record deliberate deprecation decision if staff notification composer is out-of-scope; otherwise rebuild

## G2-17-026-058  [P2] MISSING  facet F20  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/sse/SseEmitterRegistry.java:47-51 max3 SSE streams per person, docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:244-269 >3000 class stream returns 429
- vNext now: src/app/api/notifications/route.ts:8-37 no connection management
- Fix: Apply connection quotas, stale stream cleanup and tenant-scoped fanout when live transport added
