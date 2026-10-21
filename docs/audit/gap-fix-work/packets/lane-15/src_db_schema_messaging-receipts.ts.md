# Work packet: edit src/db/schema/messaging-receipts.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/sms-delivery-log.md, docs/audit/gap2/lane-8/notification.md

## G2-4-016-002  [P1] GAP  facet F01  effort L
- Legacy: Legacy writes originate from OTP, job-update, notification and attendance-purpose sender paths. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:28-30`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:80-133`)
- vNext now: New OTP Exotel logs structured events, attendance has separate outbox, TPO receipts only campaign sends. (`src/modules/notifications/exotel-sms.ts:125-138`; `src/modules/attendance/parent-sms-service.ts:102-155`; `src/db/schema/messaging-receipts.ts:59-78`)
- Fix: Create shared append-only attempt ledger integrated with every SMS sender.

## G2-4-016-011  [P1] GAP  facet F04  effort M
- Legacy: Legacy recipient_suffix varchar8, writer stores last 4 digits of phone. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:32-34`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:235-239`)
- vNext now: Generic receipts have opaque recipientKey HMAC, no suffix lookup. (`src/db/schema/messaging-receipts.ts:63-70`)
- Fix: Retain 1–4 digit suffix in dedicated support ledger, not generic campaign receipts.

## G2-4-016-012  [P1] GAP  facet F04  effort M
- Legacy: Legacy status SENT or FAILED means API acceptance, not handset delivery. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:36-43`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:80-83`)
- vNext now: Generic receipt status includes QUEUED,SENT,FAILED,SUPPRESSED; staged canonical outcome PROVIDER_ACCEPTED. (`src/db/schema/messaging-receipts.ts:88-94`; `scripts/sql/db10-sms-delivery-attempts-staging.sql:56-58`)
- Fix: Use truthful PROVIDER_ACCEPTED for legacy SENT with explanatory migration.

## G2-4-016-013  [P1] MISSING  facet F04  effort M
- Legacy: Legacy provider_message_id varchar64 for accepted attempt. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:45-46`)
- vNext now: New Exotel OTP response reads Sid but structured log omits it; generic receipts omit provider id. (`src/modules/notifications/exotel-sms.ts:113-129`; `src/db/schema/messaging-receipts.ts:59-78`)
- Fix: Persist safe provider trace ID in append-only attempt.

## G2-4-016-015  [P1] GAP  facet F04  effort M
- Legacy: Legacy college_id nullable integer; send writer does not populate collegeId. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:51-52`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:220-229`)
- vNext now: Staged attempts optional organizationId+collegeId UUID pair, generic receipt requires batch college. (`scripts/sql/db10-sms-delivery-attempts-staging.sql:22-25`; `src/db/schema/messaging-receipts.ts:24-30`)
- Fix: Capture known tenant in send context while supporting pre-login null scope.

## G2-4-016-035  [P1] GAP  facet F10  effort L
- Legacy: Legacy Exotel records FAILED for missing job/general notification DLT id. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:95-109`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:123-133`)
- vNext now: New generic provider validates DLT but receipts are campaign-only; no global SMS attempt ledger. (`src/modules/messaging/providers.ts:62-86`; `src/db/schema/messaging-receipts.ts:59-78`)
- Fix: Persist FAILED attempt on DLT rejection for job/general SMS.

## G2-4-016-041  [P1] GAP  facet F11  effort M
- Legacy: Legacy sms rows can have null college_id and still be visible globally. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:51-52`)
- vNext now: New generic receipts linked to required college-owned batch; staged attempts permit null for OTP. (`src/db/schema/messaging-receipts.ts:21-30`; `scripts/sql/db10-sms-delivery-attempts-staging.sql:22-25`)
- Fix: Include pre-login OTP attempts without manufacturing tenant identity.

## G2-4-016-045  [P1] MISSING  facet F12  effort M
- Legacy: Legacy on accepted record stores provider id, on failed records stores short error summary. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:45-49`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:220-229`)
- vNext now: Generic campaign receipt has neither providerId nor summary. (`src/db/schema/messaging-receipts.ts:59-78`)
- Fix: Persist per-attempt provider ID and safe failure data.

## G2-4-016-060  [P1] GAP  facet F19  effort M
- Legacy: Legacy DB indexes created_at and (recipient_suffix,purpose). (`docs/legacy-source/backend/src/main/resources/db/migration/V134__sms_delivery_log.sql:37-40`)
- vNext now: Staged table indexes both plus tenant, not registered; generic receipts index batch/status. (`scripts/sql/db10-sms-delivery-attempts-staging.sql:91-99`; `src/db/schema/messaging-receipts.ts:79-88`)
- Fix: Register indexed attempts table for recent and suffix+purpose lookups.

## G2-8-018-056  [P1] GAP  facet F15  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/NotificationDispatcherService.java:8-24: registry in-app, ZeptoMail, TRAI SMS
- vNext now: src/modules/activity/notification-service.ts:140-266, src/db/schema/messaging-receipts.ts:21-96: in-app writer and separate email/SMS receipts
- Fix: Trace every event to provider dispatch, not merely receipt storage.
