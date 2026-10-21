# Work packet: edit src/modules/operations/outbound-delivery-envelope.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u011-notification-scheduler.md

## G2-16-011-009  [P1] MISSING  facet F04  effort M
- Legacy: NotificationSchedulerService.java:427-456 reminder variables learnerName/assignmentName/contentType/dueDate/courseSlug/name.
- vNext now: src/modules/operations/outbound-delivery-envelope.ts:1-25 generic delivery envelope, no assignment variables.
- Fix: Build legacy compatible template data mapper, IST date formatting.

## G2-16-011-010  [P1] MISSING  facet F04  effort M
- Legacy: NotificationSchedulerService.java:357-384 interview variables applicationId/roundName/time/location.
- vNext now: src/modules/operations/outbound-delivery-envelope.ts:1-25 no interview-specific template payload.
- Fix: Build interview reminder payload with required applicationId.
