# Work packet: edit src/modules/operations/scheduled-job-lease.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u032-cross05-scheduled-jobs.md, docs/audit/gap2/lane-17/tpo-scheduled-jobs.md, docs/audit/gap2/lane-19/job-auto-expiry-service.md

## G2-5-032-057  [P0] MISSING  facet F20  effort M
- Legacy: Legacy atomic MySQL UPDATE expired lock or INSERT IGNORE, expiry NOW(6). `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SchedulerLockService.java:76-93`
- vNext now: vNext pure lease proposal, no Postgres adapter/migration wired. `src/modules/operations/scheduled-job-lease.ts:66-90`, `docs/planning/database-parity-db10-scheduler-runner-handoff.md:20-24`
- Fix: Implement single atomic Postgres claim/renew with DB clock and fence.

## G2-5-032-064  [P0] GAP  facet F22  effort M
- Legacy: Legacy scheduled_job_lock table jobName, lockedUntil, lockedBy, lease. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SchedulerLockService.java:14-35`
- vNext now: vNext pure model adds fence but Postgres table/migration not live. `src/modules/operations/scheduled-job-lease.ts:11-29`, `docs/planning/database-parity-db10-scheduler-runner-handoff.md:14-16`
- Fix: Create durable scheduled-job lease schema and fencing constraint.

## G2-17-010-001  [P1] GAP  facet F01  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:19-35 — Spring singleton scheduled component delegates to nine service dependencies, no direct UI route.
- vNext now: src/modules/operations/scheduled-job-lease.ts:1-10 — TypeScript lease policy is pure, no scheduler loop.
- Fix: Build deployment-owned invocation schedule/worker registry and persistent lease adapter.

## G2-17-010-002  [P1] GAP  facet F01  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:11-18 — Says exactly one replica via SchedulerLockService; outbox dispatcher excluded.
- vNext now: src/modules/operations/scheduled-job-lease.ts:5-10 — Lease design requires DB adapter and fencing but implementation absent in this module.
- Fix: Separate outbox worker from scheduled job lease and wire durable storage.

## G2-17-010-014  [P1] GAP  facet F03  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:33-35 — `once(name,lease,job)` uniformly wraps each handler.
- vNext now: src/modules/operations/scheduled-job-lease.ts:70-91 — Pure lease claim only, no handler wrapper or persisted lock.
- Fix: Wrap every scheduler handler with durable claim and fencing.

## G2-17-010-054  [P1] GAP  facet F20  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SchedulerLockService.java:44-60 — Legacy lock fails open under DB outage, may duplicate emails.
- vNext now: src/modules/operations/scheduled-job-lease.ts:5-10 — Proposes fail-closed for non-idempotent messages.
- Fix: Choose safe fail-closed with retry and dedupe rather than duplicates.

## G2-19-011-028  [P1] GAP  facet F10  effort M
- Legacy: Legacy optional scheduler lock absent runs anyway `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:35-41`
- vNext now: vNext lease model documents safer persistence requirement for non-idempotent jobs `src/modules/operations/scheduled-job-lease.ts:2-10`
- Fix: Decide fail-safe strategy and ensure metrics on lock failure.

## G2-5-032-013  [P1] GAP  facet F06  effort M
- Legacy: Legacy daily deadlineToday cron 08:00 Asia/Kolkata, lease30m. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:42-43`
- vNext now: vNext runner validates TTL but cadence unspecified. `src/modules/operations/scheduled-job-lease.ts:35-49`, `src/modules/operations/scheduled-job-runner.ts:47-65`
- Fix: Schedule 08:00 IST using TZ-aware cron and 30m lease.

## G2-17-010-022  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SchedulerLockService.java:44-61 — Unavailable lock storage logs warning and runs task anyway (fail-open).
- vNext now: src/modules/operations/scheduled-job-lease.ts:5-10 — vNext recommends fail-closed on non-idempotent customer messaging.
- Fix: Implement fail-closed + alert and recovery, explicitly approve changed policy.
