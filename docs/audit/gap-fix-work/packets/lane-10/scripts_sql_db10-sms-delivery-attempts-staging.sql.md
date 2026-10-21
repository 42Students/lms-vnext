# Work packet: edit scripts/sql/db10-sms-delivery-attempts-staging.sql

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/sms-delivery-log-repository.md, docs/audit/gap2/lane-4/sms-delivery-log.md

## G2-19-014-010  [P1] GAP  facet F05  effort M
- Legacy: Legacy exact recipientSuffix and purpose AND optional null filters `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SmsDeliveryLogRepository.java:18-24`
- vNext now: vNext staged index `(recipient_suffix,purpose,created_at DESC)` but not deployed read query `scripts/sql/db10-sms-delivery-attempts-staging.sql:94-99`
- Fix: Implement exact-match suffix and purpose predicates before paginating.

## G2-19-014-024  [P1] MISSING  facet F10  effort M
- Legacy: Legacy query optionally filters by suffix/purpose and ordered descending `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SmsDeliveryLogRepository.java:18-24`
- vNext now: vNext staging has index but no published read route `scripts/sql/db10-sms-delivery-attempts-staging.sql:91-99`
- Fix: Register transactional read handler and route.

## G2-19-014-025  [P1] GAP  facet F11  effort M
- Legacy: Legacy superadmin-only cross-tenant support read `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:29-31` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:58-59`
- vNext now: vNext staged table contains tenant paired IDs and optional global OTP rows `scripts/sql/db10-sms-delivery-attempts-staging.sql:22-25` `scripts/sql/db10-sms-delivery-attempts-staging.sql:60-61`
- Fix: Implement permissions for global support and forbid arbitrary org selection by non-global roles.

## G2-19-014-042  [P1] GAP  facet F20  effort L
- Legacy: Legacy provider logging precedes later read without delayed recomputation `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:8-17`
- vNext now: vNext current log only transient observability, staged row not yet registered `src/modules/notifications/exotel-sms.ts:125-137` `scripts/sql/db10-sms-delivery-attempts-staging.sql:1-2`
- Fix: Persist attempt atomically or durably enqueue recorder for support lookup.

## G2-19-014-043  [P1] GAP  facet F21  effort L
- Legacy: Legacy JpaRepository + `@Query` support reads `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SmsDeliveryLogRepository.java:6-12` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SmsDeliveryLogRepository.java:18-24`
- vNext now: vNext Drizzle staging SQL without registered adapter, Exotel provider only `scripts/sql/db10-sms-delivery-attempts-staging.sql:1-19` `src/modules/notifications/exotel-sms.ts:52-55`
- Fix: Create typed Drizzle repository and admin reader.

## G2-19-014-045  [P1] GAP  facet F22  effort L
- Legacy: Legacy table `sms_delivery_log` integer ID, purpose, suffix, status, provider id, error_summary, college_id, created_at `docs/legacy-source/backend/src/main/resources/db/migration/V134__sms_delivery_log.sql:20-35`
- vNext now: vNext staging `sms_delivery_attempts` UUID, org/college/provider/outcome/source event and timestamps `scripts/sql/db10-sms-delivery-attempts-staging.sql:19-48`
- Fix: Map legacy rows to new privacy-safe table and status codes.

## G2-4-016-012  [P1] GAP  facet F04  effort M
- Legacy: Legacy status SENT or FAILED means API acceptance, not handset delivery. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:36-43`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:80-83`)
- vNext now: Generic receipt status includes QUEUED,SENT,FAILED,SUPPRESSED; staged canonical outcome PROVIDER_ACCEPTED. (`src/db/schema/messaging-receipts.ts:88-94`; `scripts/sql/db10-sms-delivery-attempts-staging.sql:56-58`)
- Fix: Use truthful PROVIDER_ACCEPTED for legacy SENT with explanatory migration.

## G2-4-016-015  [P1] GAP  facet F04  effort M
- Legacy: Legacy college_id nullable integer; send writer does not populate collegeId. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:51-52`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:220-229`)
- vNext now: Staged attempts optional organizationId+collegeId UUID pair, generic receipt requires batch college. (`scripts/sql/db10-sms-delivery-attempts-staging.sql:22-25`; `src/db/schema/messaging-receipts.ts:24-30`)
- Fix: Capture known tenant in send context while supporting pre-login null scope.

## G2-4-016-041  [P1] GAP  facet F11  effort M
- Legacy: Legacy sms rows can have null college_id and still be visible globally. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:51-52`)
- vNext now: New generic receipts linked to required college-owned batch; staged attempts permit null for OTP. (`src/db/schema/messaging-receipts.ts:21-30`; `scripts/sql/db10-sms-delivery-attempts-staging.sql:22-25`)
- Fix: Include pre-login OTP attempts without manufacturing tenant identity.

## G2-4-016-046  [P1] GAP  facet F12  effort M
- Legacy: Legacy attempt log is append-on-send; new retries create separate record. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:220-233`)
- vNext now: Staged table proposes attemptNumber and append-only guard but is unregistered. (`scripts/sql/db10-sms-delivery-attempts-staging.sql:43-48`; `docs/planning/database-parity-db10-sms-delivery-attempts.md:133-141`)
- Fix: Register safe append-only ledger preserving each retry.

## G2-4-016-060  [P1] GAP  facet F19  effort M
- Legacy: Legacy DB indexes created_at and (recipient_suffix,purpose). (`docs/legacy-source/backend/src/main/resources/db/migration/V134__sms_delivery_log.sql:37-40`)
- vNext now: Staged table indexes both plus tenant, not registered; generic receipts index batch/status. (`scripts/sql/db10-sms-delivery-attempts-staging.sql:91-99`; `src/db/schema/messaging-receipts.ts:79-88`)
- Fix: Register indexed attempts table for recent and suffix+purpose lookups.

## G2-4-016-070  [P1] GAP  facet F22  effort M
- Legacy: Legacy status SENT/FAILED, no DELIVERY guarantee. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:36-43`)
- vNext now: Staged outcome uses PROVIDER_ACCEPTED/FAILED with provider-accepted timestamp. (`scripts/sql/db10-sms-delivery-attempts-staging.sql:34-48`)
- Fix: Migrate accepted semantics explicitly and prohibit false delivery inference.

## G2-4-016-029  [P2] GAP  facet F07  effort M
- Legacy: Legacy provider failure report uses safe terse reason such as DLT template ID not configured. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:96-101`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:123-129`)
- vNext now: New OTP structured log only generic reason; staged DB has safe_failure_code/summary. (`src/modules/notifications/exotel-sms.ts:65-74`; `scripts/sql/db10-sms-delivery-attempts-staging.sql:37-40`)
- Fix: Report fixed nonsecret reason/codes; never raw provider response.
