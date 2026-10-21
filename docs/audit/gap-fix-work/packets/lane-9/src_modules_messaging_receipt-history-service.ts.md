# Work packet: edit src/modules/messaging/receipt-history-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/sms-delivery-log.md

## G2-4-016-003  [P1] GAP  facet F01  effort L
- Legacy: Legacy thin log exists to answer support questions about absence messages. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:8-17`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:22-31`)
- vNext now: New parent SMS outbox records attempts but no cross-system support lookup by last-four digits. (`src/modules/attendance/parent-sms-service.ts:102-155`; `src/modules/messaging/receipt-history-service.ts:43-81`)
- Fix: Provide privacy-safe support lookup across OTP, absence, correction and job SMS.

## G2-4-016-017  [P1] GAP  facet F05  effort M
- Legacy: Legacy search can narrow by recipientSuffix and exact purpose simultaneously. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SmsDeliveryLogRepository.java:18-24`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:53-71`)
- vNext now: New TPO history filters purpose but no suffix, and reads batches rather than attempts. (`src/modules/messaging/receipt-history-service.ts:51-55`)
- Fix: Implement AND predicate suffix+purpose on append-only attempts.

## G2-4-016-027  [P1] GAP  facet F07  effort L
- Legacy: Legacy requires Super Admin; unauthorized access blocked before list call. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:58-60`)
- vNext now: New history requires active TPO, not Super Admin, and tenant-scoped permission. (`src/modules/messaging/receipt-history-service.ts:44-61`)
- Fix: Keep Super Admin only for global attempts; do not expose suffix across colleges to TPO by default.

## G2-4-016-057  [P1] GAP  facet F17  effort M
- Legacy: Suffix search allows pasting number then sanitizes; risks exposing pasted value through URL. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:61-68`)
- vNext now: New no suffix search; proposed UI needed. (`src/modules/messaging/receipt-history-service.ts:51-56`)
- Fix: Never log full pasted phone or retain it in URL/history; send only suffix.
