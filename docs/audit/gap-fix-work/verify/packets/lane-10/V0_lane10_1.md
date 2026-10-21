# Verification packet (P0, do FIRST): 9 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-16-011-043 [P0] MISSING facet F20
- Files: src/modules/operations/scheduled-job-runner.ts
- Legacy: NotificationSchedulerService.java:102-104 minute tick, duplicate sends guarded by lease but no recipient dedupe.
- Expected fix: Implement persisted idempotency key recipient+event+date/window before deployment.

## G2-16-011-050 [P0] MISSING facet F23
- Files: src/modules/operations/scheduled-job-runner.ts
- Legacy: NotificationSchedulerService.java:102-338 four independent scheduled jobs with intervals.
- Expected fix: Integrate all four jobs into operational scheduler before claiming notification parity.

## G2-16-012-030 [P0] MISSING facet F13
- Files: src/modules/operations/postgres-scheduled-job-lease-store.ts
- Legacy: SchedulerLockService.java:76-92 missing lock table causes fail-open.
- Expected fix: Register migration and validate readiness; absent table must not silently disable all scheduled jobs.

## G2-16-012-047 [P0] MISSING facet F23
- Files: src/modules/operations/scheduled-job-runner.ts
- Legacy: SchedulerLockService.java:32-103 functional distributed lease exists in old production.
- Expected fix: Complete migration+runtime wiring+outbox, then prove actual job locks between replicas.

## G2-5-032-001 [P0] MISSING facet F01
- Files: src/modules/operations/scheduled-job-runner.ts
- Legacy: Legacy scheduling active in Spring `@Scheduled` on every backend replica, no manual entry. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:21-75`
- Expected fix: Provision production scheduler tick endpoint/worker with persisted lease and every job binding.

## G2-5-032-030 [P0] MISSING facet F10
- Files: src/modules/operations/scheduled-job-runner.ts
- Legacy: Legacy each scheduled method calls domain service inside SchedulerLockService. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:42-73`
- Expected fix: Build DB lease adapter, persisted scheduler and complete job->service mapping.

## G2-5-032-057 [P0] MISSING facet F20
- Files: src/modules/operations/scheduled-job-lease.ts
- Legacy: Legacy atomic MySQL UPDATE expired lock or INSERT IGNORE, expiry NOW(6). `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SchedulerLockService.java:76-93`
- Expected fix: Implement single atomic Postgres claim/renew with DB clock and fence.

## G2-5-032-064 [P0] GAP facet F22
- Files: src/modules/operations/scheduled-job-lease.ts
- Legacy: Legacy scheduled_job_lock table jobName, lockedUntil, lockedBy, lease. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SchedulerLockService.java:14-35`
- Expected fix: Create durable scheduled-job lease schema and fencing constraint.

## G2-19-026-056 [P0] GAP facet F20
- Files: src/modules/module-access/super-admin-student-bulk-rule-service.ts
- Legacy: Legacy bulk preflights all IDs/locks and commits atomically. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleAccessService.java:565`
- Expected fix: Stop partial success or make result preview/rollback behavior a deliberate product decision.
