# Work packet: edit src/modules/messaging/receipt-detail-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/sms-delivery-log.md

## G2-4-016-040  [P1] GAP  facet F11  effort L
- Legacy: Legacy controller requireSuperAdmin, global support sees all attempts. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:29-31`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:58-60`)
- vNext now: New TPO detail checks college membership and persisted permission. (`src/modules/messaging/receipt-detail-service.ts:12-29`)
- Fix: Implement globally privileged support access while respecting privacy and audit.
