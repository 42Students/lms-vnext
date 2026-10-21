# Work packet: edit src/modules/placements/tpo-my-notifications-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/cross-notifications.md

## G2-4-032-002  [P1] GAP  facet F01  effort M
- Legacy: Super Admin global notification fetchAll pageNo/pageSize (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:88-105`)
- vNext now: New per-role scoped notification views, not global admin list (`src/modules/placements/tpo-my-notifications-service.ts:61-107`)
- Fix: Restore restricted platform-wide notification audit/list view.
