# Work packet (wave 3): edit scripts/sql/db10-sms-delivery-attempts-staging.sql

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/sms-delivery-log-repository.md, docs/audit/gap2/lane-4/sms-delivery-log.md

## G2-19-014-001  [P1] MISSING  facet F01  effort L
- Legacy: Legacy support GET `/api/v1/admin/sms-log` relies on SmsDeliveryLogRepository.search `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:33-53` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SmsDeliveryLogRepository.java:18-24`
- vNext now: vNext Exotel sender emits structured logs; DB-031 support ledger is staging-only `src/modules/notifications/exotel-sms.ts:125-130` `scripts/sql/db10-sms-delivery-attempts-staging.sql:1-19`
- Fix: Register SMS attempt persistence and scoped admin read route before support parity signoff.

## G2-19-014-047  [P1] MISSING  facet F23  effort L
- Legacy: Legacy operator-acceptance record durable in MySQL with support endpoint `docs/legacy-source/backend/src/main/resources/db/migration/V134__sms_delivery_log.sql:20-40` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:49-83`
- vNext now: vNext PostgreSQL attempt schema staged NOT a numbered Drizzle migration `scripts/sql/db10-sms-delivery-attempts-staging.sql:1-2` `docs/planning/database-parity-db10-sms-delivery-attempts.md:7-11`
- Fix: Register and deploy DB-031 before declaring functional parity.

## G2-4-016-067  [P1] MISSING  facet F22  effort L
- Legacy: Legacy V134 table uses int ID, VARCHAR(64) purpose, suffix8, status16, providerId64, error500, college INT nullable, timestamp. (`docs/legacy-source/backend/src/main/resources/db/migration/V134__sms_delivery_log.sql:20-35`)
- vNext now: DB31 staged attempts expands fields/provider/outcome but has not been registered in migration or Drizzle schema. (`scripts/sql/db10-sms-delivery-attempts-staging.sql:19-48`; `docs/planning/database-parity-db10-sms-delivery-attempts.md:1-12`)
- Fix: Register vetted migration plus Drizzle schema and backfill mapping.
