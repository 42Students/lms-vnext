# Work packet (wave 3): edit src/modules/operations/postgres-scheduled-job-lease-store.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u012-scheduler-lock-service.md, docs/audit/gap2/lane-16/u011-notification-scheduler.md

## G2-16-012-030  [P0] MISSING  facet F13  effort L
- Legacy: SchedulerLockService.java:76-92 missing lock table causes fail-open.
- vNext now: postgres-scheduled-job-lease-store.ts:60-80 requires table; draft schema unregistered.
- Fix: Register migration and validate readiness; absent table must not silently disable all scheduled jobs.

## G2-16-011-046  [P1] MISSING  facet F21  effort L
- Legacy: NotificationSchedulerService.java:68-76 optional DB lease table.
- vNext now: scheduled-job-runner.ts:14-22 and postgres-scheduled-job-lease-store.ts:54-80 adapter authored but unregistered migration.
- Fix: Register lease schema and wire the live adapter.
