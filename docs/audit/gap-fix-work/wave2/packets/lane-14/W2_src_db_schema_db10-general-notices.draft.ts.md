# Work packet (wave 2): edit src/db/schema/db10-general-notices.draft.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/exotel-sms-service-impl.md

## G2-3-012-045  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SmsDeliveryLogRepository.java:18-24`, `docs/legacy-source/backend/src/main/resources/db/migration/V134__sms_delivery_log.sql:37-40`
- vNext now: `src/db/schema/db10-general-notices.draft.ts:69-78`
- Fix: Legacy log has indexes on created and suffix+purpose; vNext draft outbox indexes due/status/recipient instead. Create privacy-minimal log with suitable search indexes.
