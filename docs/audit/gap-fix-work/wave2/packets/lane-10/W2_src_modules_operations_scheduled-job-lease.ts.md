# Work packet (wave 2): edit src/modules/operations/scheduled-job-lease.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/tpo-scheduled-jobs.md, docs/audit/gap2/lane-19/job-auto-expiry-service.md, docs/audit/gap2/lane-5/u032-cross05-scheduled-jobs.md

## G2-17-010-042  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SchedulerLockService.java:54-64 — Lock failure warn and run; existing lease skip logged debug.
- vNext now: src/modules/operations/scheduled-job-lease.ts:25-28 — Claim result identifies HELD; no log/health reporting in pure policy.
- Fix: Emit worker metrics for HELD, failed and completed ticks.

## G2-17-010-049  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:42-73 — Job names exactly `tpo.deadlineToday`, etc.
- vNext now: src/modules/operations/scheduled-job-lease.ts:18-23 — Generic jobName type allows arbitrary name; no names registry.
- Fix: Use exact canonical names in worker config.

## G2-19-011-052  [P2] GAP  facet F20  effort M
- Legacy: Legacy lock fails open when table unreachable `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SchedulerLockService.java:43-69`
- vNext now: vNext lease contract documents fail-safe persistence for non-idempotent work `src/modules/operations/scheduled-job-lease.ts:2-10`
- Fix: Choose and document lock unavailable behavior and observability.

## G2-19-011-054  [P2] GAP  facet F21  effort M
- Legacy: Legacy SchedulerLockService conditional DB UPDATE/INSERT IGNORE with lease `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SchedulerLockService.java:73-91`
- vNext now: vNext DB10 lease pure model proposes claim only `src/modules/operations/scheduled-job-lease.ts:70-89`
- Fix: Wire an atomic SQL lease adapter instead of calling pure model alone.

## G2-5-032-008  [P2] GAP  facet F04  effort M
- Legacy: Legacy TPO task schedule metadata encoded annotations and lock names. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:42-73`
- vNext now: vNext lease has jobName/fence/owner/expiry but no persisted cadence metadata. `src/modules/operations/scheduled-job-lease.ts:11-25`
- Fix: Store job key, cadence, zone, last-start/end/results separately.

## G2-5-032-060  [P2] GAP  facet F20  effort M
- Legacy: Legacy cleanup time based on server LocalDateTime, potentially UTC skew. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/TokenBlocklistCleanupService.java:26-30`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/UserSessionServiceImpl.java:120-125`
- vNext now: vNext lease expects explicit Date and DB clock adapter not yet built. `src/modules/operations/scheduled-job-lease.ts:35-49`
- Fix: Use DB UTC time for deletes/expirations.
