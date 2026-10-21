# Work packet (wave 2): edit src/modules/operations/outbound-delivery-envelope.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u011-notification-scheduler.md

## G2-16-011-008  [P2] MISSING  facet F04  effort S
- Legacy: NotificationSchedulerService.java:409-419 interview rounds Screening/Technical/HR/Managerial/Final labels.
- vNext now: src/modules/operations/outbound-delivery-envelope.ts:1-25 generic message contract lacks round label mapping.
- Fix: Map round names and descriptions in reminder variables.

## G2-16-011-038  [P2] MISSING  facet F18  effort S
- Legacy: NotificationSchedulerService.java:429-438 Assignment template title `Assignment` fallback, formatted IST due date.
- vNext now: src/modules/operations/outbound-delivery-envelope.ts:1-25 no template field mapping.
- Fix: Use exact assignment/quiz labels and date strings.

## G2-16-011-039  [P2] MISSING  facet F18  effort S
- Legacy: NotificationSchedulerService.java:409-419 title-case round suffix `Round`.
- vNext now: src/modules/operations/outbound-delivery-envelope.ts:1-25 no round-name text.
- Fix: Provide exact round strings.
