# Work packet: NEW / MISSING items from docs/audit/gap2/lane-18/notification-service.md

1 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-18/notification-service.md

## G2-18-012-026  [P1] GAP  facet F10  effort L
- Legacy: Legacy CRUD service supports findById/fetch/class/course/recipient and write endpoints (`NotificationService.java:13-57`).
- vNext now: New GET own list and POST own read, no analogous arbitrary CRUD endpoints (`notifications/route.ts:8-37`; `learn/notifications/read/route.ts:9-23`).
- Fix: Publish explicit API parity matrix for authoring/admin and recipient feeds.
