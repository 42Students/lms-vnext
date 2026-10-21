# Work packet (wave 3): edit src/modules/messaging/receipt-history-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/sms-delivery-log.md

## G2-4-016-001  [P1] MISSING  facet F01  effort L
- Legacy: Legacy SMS attempt evidence is read at GET /api/v1/admin/sms-log, Super Admin only. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:29-59`)
- vNext now: New nearest TPO messaging history is college-scoped; no corresponding SMS attempt read route. (`src/modules/messaging/receipt-history-service.ts:43-56`)
- Fix: Implement Super Admin attempt history endpoint and navigation with strictly safe fields.
