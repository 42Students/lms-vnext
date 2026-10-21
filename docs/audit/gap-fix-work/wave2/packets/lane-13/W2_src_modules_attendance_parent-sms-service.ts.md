# Work packet (wave 2): edit src/modules/attendance/parent-sms-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/sms-delivery-log.md

## G2-4-016-059  [P2] GAP  facet F18  effort S
- Legacy: Legacy purpose examples attendance.absence/attendance.correction/otp/job.update. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:28-30`)
- vNext now: New OTP purpose is implicit log key sms.otp_accepted, parent SMS kind ABSENT/CORRECTED. (`src/modules/notifications/exotel-sms.ts:125-130`; `src/modules/attendance/parent-sms-service.ts:142-146`)
- Fix: Normalize purpose values into exact stable codes.

## G2-4-016-066  [P2] GAP  facet F21  effort M
- Legacy: Legacy sends record on failure/success after provider API, no job queue for each attempt. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:147-233`)
- vNext now: New attendance outbox separates event queue and API attempt; generic campaigns batch receipts. (`src/modules/attendance/parent-sms-service.ts:102-155`; `src/db/schema/messaging-receipts.ts:21-78`)
- Fix: Append provider evidence separately from outbox state; never conflate retry commands with attempts.
