# Work packet (wave 3): edit src/modules/operations/scheduled-job-lease.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/tpo-scheduled-jobs.md

## G2-17-010-013  [P1] MISSING  facet F03  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:42-73 — Ten named scheduled methods have distinct timings.
- vNext now: src/modules/operations/scheduled-job-lease.ts:18-28 — Lease policy has generic jobName with no registry or cron definitions.
- Fix: Publish ten-job registry with triggers, owners and status.

## G2-17-010-036  [P1] MISSING  facet F11  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SchedulerLockService.java:14-29 — Same lock table shared across replicas for globally single run.
- vNext now: src/modules/operations/scheduled-job-lease.ts:53-91 — Pure snapshot check cannot enforce cross-replica claim.
- Fix: Persist atomic lease claim against shared DB.

## G2-17-010-058  [P1] MISSING  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SchedulerLockService.java:78-91 — Legacy lock stores job_name, locked_until, locked_by in scheduled_job_lock table.
- vNext now: src/modules/operations/scheduled-job-lease.ts:11-28 — Lease type adds holderId/fence but no actual table adapter.
- Fix: Register Postgres lease schema with fence bigint, unique jobName, conditional claim.
