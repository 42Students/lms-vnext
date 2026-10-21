# Work packet (wave 3): edit src/modules/notifications/exotel-sms.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u011-notification-scheduler.md, docs/audit/gap2/lane-19/sms-delivery-log-repository.md

## G2-16-011-034  [P1] MISSING  facet F15  effort L
- Legacy: NotificationSchedulerService.java:357-402 interview reminder template has named round, India time.
- vNext now: src/modules/notifications/exotel-sms.ts:1-15 transport only.
- Fix: Map exact context and channel templates.

## G2-16-011-045  [P1] MISSING  facet F21  effort L
- Legacy: NotificationSchedulerService.java:58-63 Optional NotificationDispatcherService and DB.
- vNext now: src/modules/notifications/zeptomail-email.ts and exotel-sms.ts transports; no scheduled integration.
- Fix: Connect and configure dispatcher and templates at job runtime.

## G2-19-014-001  [P1] MISSING  facet F01  effort L
- Legacy: Legacy support GET `/api/v1/admin/sms-log` relies on SmsDeliveryLogRepository.search `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:33-53` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SmsDeliveryLogRepository.java:18-24`
- vNext now: vNext Exotel sender emits structured logs; DB-031 support ledger is staging-only `src/modules/notifications/exotel-sms.ts:125-130` `scripts/sql/db10-sms-delivery-attempts-staging.sql:1-19`
- Fix: Register SMS attempt persistence and scoped admin read route before support parity signoff.

## G2-19-014-014  [P1] MISSING  facet F06  effort L
- Legacy: Legacy repository `search(suffix,purpose,Pageable)` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SmsDeliveryLogRepository.java:18-24`
- vNext now: vNext no caller-facing SMS support query in inspected Exotel provider `src/modules/notifications/exotel-sms.ts:52-55`
- Fix: Provide read-only SQL query endpoint backed by registered table.
