# Work packet (wave 3): edit src/modules/notifications/zeptomail-email.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u011-notification-scheduler.md

## G2-16-011-033  [P1] MISSING  facet F15  effort L
- Legacy: NotificationSchedulerService.java:428-474 per-learner assignment/quiz due notification dispatched with template.
- vNext now: src/modules/notifications/zeptomail-email.ts:1-15 channel transport; no reminder orchestration.
- Fix: Create durable outbox + event template and multi-channel dispatch.

## G2-16-011-045  [P1] MISSING  facet F21  effort L
- Legacy: NotificationSchedulerService.java:58-63 Optional NotificationDispatcherService and DB.
- vNext now: src/modules/notifications/zeptomail-email.ts and exotel-sms.ts transports; no scheduled integration.
- Fix: Connect and configure dispatcher and templates at job runtime.
