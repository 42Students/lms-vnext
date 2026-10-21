# Work packet: edit src/modules/operations/postgres-scheduled-job-lease-store.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u012-scheduler-lock-service.md

## G2-16-012-023  [P1] GAP  facet F10  effort L
- Legacy: SchedulerLockService.java:76-92 direct JDBC SQL on scheduled_job_lock.
- vNext now: postgres-scheduled-job-lease-store.ts:54-126 Drizzle SQL adapter for acquire/renew/current.
- Fix: Register physical Postgres migration, wire adapter and prove concurrency against real DB.

## G2-16-012-043  [P1] GAP  facet F21  effort M
- Legacy: SchedulerLockService.java:36-39 optional JDBC dependency.
- vNext now: postgres-scheduled-job-lease-store.ts:1-4 Drizzle getDb required.
- Fix: Ensure deployed runner has DB connectivity and migration before enabling cron.

## G2-16-012-045  [P1] GAP  facet F22  effort L
- Legacy: SchedulerLockService.java:80-91 legacy scheduled_job_lock fields lockUntil/by plus name.
- vNext now: postgres-scheduled-job-lease-store.ts:60-77 uses 5 cols incl updated_at and fence, schema draft.
- Fix: Register database schema with job_name PK, locked_until, locked_by, updated_at, fence.
