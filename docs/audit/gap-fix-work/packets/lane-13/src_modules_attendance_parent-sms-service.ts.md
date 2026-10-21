# Work packet: edit src/modules/attendance/parent-sms-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/sms-delivery-log.md, docs/audit/gap2/lane-8/attend.md

## G2-4-016-002  [P1] GAP  facet F01  effort L
- Legacy: Legacy writes originate from OTP, job-update, notification and attendance-purpose sender paths. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:28-30`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:80-133`)
- vNext now: New OTP Exotel logs structured events, attendance has separate outbox, TPO receipts only campaign sends. (`src/modules/notifications/exotel-sms.ts:125-138`; `src/modules/attendance/parent-sms-service.ts:102-155`; `src/db/schema/messaging-receipts.ts:59-78`)
- Fix: Create shared append-only attempt ledger integrated with every SMS sender.

## G2-4-016-003  [P1] GAP  facet F01  effort L
- Legacy: Legacy thin log exists to answer support questions about absence messages. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:8-17`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:22-31`)
- vNext now: New parent SMS outbox records attempts but no cross-system support lookup by last-four digits. (`src/modules/attendance/parent-sms-service.ts:102-155`; `src/modules/messaging/receipt-history-service.ts:43-81`)
- Fix: Provide privacy-safe support lookup across OTP, absence, correction and job SMS.

## G2-4-016-037  [P1] GAP  facet F10  effort M
- Legacy: Legacy Exotel catches network/provider errors, writes FAILED reason, returns false. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:199-204`)
- vNext now: New OTP writes only structured warning; attendance outbox result status. (`src/modules/notifications/exotel-sms.ts:131-138`; `src/modules/attendance/parent-sms-service.ts:142-155`)
- Fix: Log failed provider attempt durably without secrets.

## G2-8-021-049  [P1] GAP  facet F15  effort M
- Legacy: Legacy first absence triggers configurable SMS to learner contactMobile asynchronously (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerServiceImpl.java:603-629).
- vNext now: New admin correction enqueues parent SMS for consented guardian via outbox and provider after commit (src/modules/attendance/admin-service.ts:632-651; src/modules/attendance/parent-sms-service.ts:19-53,84-109).
- Fix: Define migration from learner mobile delivery to separately verified parent contact/opt-in and surface no-contact status.
