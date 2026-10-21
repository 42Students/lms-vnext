# Work packet (wave 2): edit scripts/sql/db10-sms-delivery-attempts-staging.sql

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/sms-delivery-log-repository.md, docs/audit/gap2/lane-4/sms-delivery-log.md

## G2-19-014-005  [P2] GAP  facet F03  effort M
- Legacy: Legacy list supports suffix and purpose search controls via query params `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:53-72`
- vNext now: vNext Exotel adapter has no query UI; staged indexes suffix+purpose `src/modules/notifications/exotel-sms.ts:52-55` `scripts/sql/db10-sms-delivery-attempts-staging.sql:91-99`
- Fix: Add admin filters and retry/empty states, keeping raw phone unexposed.

## G2-19-014-008  [P2] GAP  facet F04  effort M
- Legacy: Legacy SENT/FAILED status strings (not delivered) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:36-43`
- vNext now: vNext staging outcome PROVIDER_ACCEPTED/FAILED `scripts/sql/db10-sms-delivery-attempts-staging.sql:34-39` `scripts/sql/db10-sms-delivery-attempts-staging.sql:56-57`
- Fix: Map SENT→PROVIDER_ACCEPTED in read DTO and historical migration.

## G2-19-014-011  [P2] GAP  facet F05  effort S
- Legacy: Legacy orderBy createdAt DESC,id DESC for deterministic paging `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SmsDeliveryLogRepository.java:18-24`
- vNext now: vNext staged index on createdAt DESC; no secondary id ordering specified in index `scripts/sql/db10-sms-delivery-attempts-staging.sql:91-95`
- Fix: Use createdAt,id descending for stable ties.

## G2-19-014-012  [P2] MISSING  facet F05  effort M
- Legacy: Legacy page 0-based, default size50 max200 `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:53-72`
- vNext now: vNext staging SQL has no pagination service `scripts/sql/db10-sms-delivery-attempts-staging.sql:19-48`
- Fix: Add server page/size bounds, deterministic total and pages.

## G2-19-014-013  [P2] GAP  facet F05  effort S
- Legacy: Legacy suffix accepts pasted number, strips nondigits, keeps last4 `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:61-68`
- vNext now: vNext staging constraint accepts 1-4 digits only `scripts/sql/db10-sms-delivery-attempts-staging.sql:50-57`
- Fix: Normalize user pasted number in support form, persist only suffix.

## G2-19-014-015  [P2] GAP  facet F06  effort M
- Legacy: Legacy input purpose blank→null, page clamped >=0, size1..200 `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:69-72`
- vNext now: vNext SQL staged purpose varchar64 nonempty, no query validation `scripts/sql/db10-sms-delivery-attempts-staging.sql:27-28` `scripts/sql/db10-sms-delivery-attempts-staging.sql:50-53`
- Fix: Zod validate purpose, suffix and bounded pagination.

## G2-19-014-041  [P2] GAP  facet F20  effort S
- Legacy: Legacy search stable tie-breaker id DESC `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SmsDeliveryLogRepository.java:21-24`
- vNext now: vNext staged only createdAt index, UUID id default `scripts/sql/db10-sms-delivery-attempts-staging.sql:19-20` `scripts/sql/db10-sms-delivery-attempts-staging.sql:91-95`
- Fix: Add tie-breaker to stable cursor pagination.

## G2-4-016-009  [P2] GAP  facet F04  effort M
- Legacy: Legacy numeric id auto-increment primary key. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:24-26`)
- vNext now: Staged SMS attempt schema UUID id, but not registered; generic TPO receipt also UUID. (`scripts/sql/db10-sms-delivery-attempts-staging.sql:19-25`; `src/db/schema/messaging-receipts.ts:59-65`)
- Fix: Map historic integer identifiers to UUID without losing stable support references.

## G2-4-016-010  [P2] GAP  facet F04  effort S
- Legacy: Legacy purpose varchar64 required, examples otp/job.update/attendance.absence/correction. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:28-30`)
- vNext now: Staged attempts purpose varchar64; generic receipts purpose varchar160. (`scripts/sql/db10-sms-delivery-attempts-staging.sql:27-29`; `src/db/schema/messaging-receipts.ts:67-70`)
- Fix: Preserve purpose taxonomy and exact match semantics.

## G2-4-016-016  [P2] GAP  facet F04  effort M
- Legacy: Legacy created_at MySQL DATETIME(6), default current timestamp. (`docs/legacy-source/backend/src/main/resources/db/migration/V134__sms_delivery_log.sql:20-35`)
- vNext now: Staged attempts use timestamptz default now; generic receipts timestamps with timezone. (`scripts/sql/db10-sms-delivery-attempts-staging.sql:47-48`; `src/db/schema/messaging-receipts.ts:72-77`)
- Fix: Backfill old timestamps explicitly as IST or source timezone with no artificial delivery.

## G2-4-016-044  [P2] GAP  facet F12  effort M
- Legacy: Legacy status only SENT or FAILED for provider attempts, not QUEUED. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:36-43`)
- vNext now: Generic receipts add QUEUED and SUPPRESSED; staged attempt outcomes only accepted or failed. (`src/db/schema/messaging-receipts.ts:88-94`; `scripts/sql/db10-sms-delivery-attempts-staging.sql:55-58`)
- Fix: Use distinct attempt vs command state enums.

## G2-4-016-064  [P2] GAP  facet F20  effort S
- Legacy: Legacy recipientSuffix lastFour returns <=4 digits if phone shorter or null. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:235-239`)
- vNext now: Staged suffix checker accepts 1..4 digits or null, rejects non-digits. (`scripts/sql/db10-sms-delivery-attempts-staging.sql:54-55`)
- Fix: Preserve null/malformed phone behavior without storing invalid digits.

## G2-4-016-068  [P2] GAP  facet F22  effort M
- Legacy: Legacy no index by college, only date and recipient+purpose. (`docs/legacy-source/backend/src/main/resources/db/migration/V134__sms_delivery_log.sql:37-40`)
- vNext now: Staged adds college/purpose and correlation indexes, not currently executable as registered schema. (`scripts/sql/db10-sms-delivery-attempts-staging.sql:91-103`)
- Fix: Implement least-privilege indexes with append-only retention policy.

## G2-19-014-038  [P3] GAP  facet F18  effort S
- Legacy: Legacy query parameter `recipientSuffix` with purpose `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:53-57`
- vNext now: vNext staging column recipient_suffix and purpose `scripts/sql/db10-sms-delivery-attempts-staging.sql:27-32`
- Fix: Keep user-facing filter names clear and display only last4.
