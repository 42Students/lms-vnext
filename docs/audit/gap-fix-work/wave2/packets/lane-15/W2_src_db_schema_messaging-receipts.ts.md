# Work packet (wave 2): edit src/db/schema/messaging-receipts.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/sms-delivery-log.md

## G2-4-016-009  [P2] GAP  facet F04  effort M
- Legacy: Legacy numeric id auto-increment primary key. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:24-26`)
- vNext now: Staged SMS attempt schema UUID id, but not registered; generic TPO receipt also UUID. (`scripts/sql/db10-sms-delivery-attempts-staging.sql:19-25`; `src/db/schema/messaging-receipts.ts:59-65`)
- Fix: Map historic integer identifiers to UUID without losing stable support references.

## G2-4-016-010  [P2] GAP  facet F04  effort S
- Legacy: Legacy purpose varchar64 required, examples otp/job.update/attendance.absence/correction. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:28-30`)
- vNext now: Staged attempts purpose varchar64; generic receipts purpose varchar160. (`scripts/sql/db10-sms-delivery-attempts-staging.sql:27-29`; `src/db/schema/messaging-receipts.ts:67-70`)
- Fix: Preserve purpose taxonomy and exact match semantics.

## G2-4-016-014  [P2] GAP  facet F04  effort M
- Legacy: Legacy error_summary varchar500, on failure sanitized/truncated. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:48-49`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:199-203`)
- vNext now: New structured OTP logs generic error type, generic receipt reason constrained to short codes. (`src/modules/notifications/exotel-sms.ts:131-137`; `src/db/schema/messaging-receipts.ts:71-93`)
- Fix: Persist bounded safe failure classification/summary for support.

## G2-4-016-016  [P2] GAP  facet F04  effort M
- Legacy: Legacy created_at MySQL DATETIME(6), default current timestamp. (`docs/legacy-source/backend/src/main/resources/db/migration/V134__sms_delivery_log.sql:20-35`)
- vNext now: Staged attempts use timestamptz default now; generic receipts timestamps with timezone. (`scripts/sql/db10-sms-delivery-attempts-staging.sql:47-48`; `src/db/schema/messaging-receipts.ts:72-77`)
- Fix: Backfill old timestamps explicitly as IST or source timezone with no artificial delivery.

## G2-4-016-039  [P2] GAP  facet F10  effort M
- Legacy: Legacy admin API reads only; writes done in provider adapters. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:49-83`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:220-233`)
- vNext now: New message campaign receipts written after send into generic table. (`src/db/schema/messaging-receipts.ts:59-78`)
- Fix: Keep send/provider ledger separated from query endpoint and enqueue outbox.

## G2-4-016-044  [P2] GAP  facet F12  effort M
- Legacy: Legacy status only SENT or FAILED for provider attempts, not QUEUED. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:36-43`)
- vNext now: Generic receipts add QUEUED and SUPPRESSED; staged attempt outcomes only accepted or failed. (`src/db/schema/messaging-receipts.ts:88-94`; `scripts/sql/db10-sms-delivery-attempts-staging.sql:55-58`)
- Fix: Use distinct attempt vs command state enums.

## G2-4-016-066  [P2] GAP  facet F21  effort M
- Legacy: Legacy sends record on failure/success after provider API, no job queue for each attempt. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:147-233`)
- vNext now: New attendance outbox separates event queue and API attempt; generic campaigns batch receipts. (`src/modules/attendance/parent-sms-service.ts:102-155`; `src/db/schema/messaging-receipts.ts:21-78`)
- Fix: Append provider evidence separately from outbox state; never conflate retry commands with attempts.
