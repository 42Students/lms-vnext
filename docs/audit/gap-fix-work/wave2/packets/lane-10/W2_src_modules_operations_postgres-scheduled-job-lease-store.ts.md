# Work packet (wave 2): edit src/modules/operations/postgres-scheduled-job-lease-store.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u012-scheduler-lock-service.md

## G2-16-012-007  [P2] GAP  facet F04  effort M
- Legacy: SchedulerLockService.java:80-91 MySQL table named `scheduled_job_lock`.
- vNext now: postgres-scheduled-job-lease-store.ts:61-77 table named `scheduled_job_leases`.
- Fix: Register Postgres table migration and ownership mapping.

## G2-16-012-016  [P2] GAP  facet F06  effort S
- Legacy: SchedulerLockService.java:94-101 computes hostname once.
- vNext now: postgres-scheduled-job-lease-store.ts:54-59 input.holderId supplied by caller.
- Fix: Supply deterministic worker ID across acquire/renew calls.

## G2-16-012-011  [P3] GAP  facet F05  effort S
- Legacy: SchedulerLockService.java:80-82 expiry test strict `< NOW(6)`.
- vNext now: postgres-scheduled-job-lease-store.ts:76 `<= clock_timestamp()`.
- Fix: Accept at-equality takeover as safe deviation; document boundary condition.
