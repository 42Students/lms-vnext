# Work packet: edit src/modules/operations/scheduled-job-runner.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u011-notification-scheduler.md, docs/audit/gap2/lane-16/u012-scheduler-lock-service.md, docs/audit/gap2/lane-5/u032-cross05-scheduled-jobs.md

## G2-16-011-006  [P1] MISSING  facet F03  effort M
- Legacy: NotificationSchedulerService.java:182-185 interview reminder 7pm IST.
- vNext now: scheduled-job-runner.ts:100-140 no interview reminder registration.
- Fix: Schedule interview reminder at 19:00 Asia/Kolkata.

## G2-16-011-007  [P1] MISSING  facet F03  effort M
- Legacy: NotificationSchedulerService.java:285-288 assignment reminders default daily 09:00 JVM zone.
- vNext now: scheduled-job-runner.ts:100-140 has no assignment/quiz job.
- Fix: Schedule assignment+quiz reminder with explicit agreed IST wall clock.

## G2-16-011-011  [P1] MISSING  facet F05  effort M
- Legacy: NotificationSchedulerService.java:187-200 tomorrow in India mapped to UTC half-open full-day window.
- vNext now: scheduled-job-runner.ts:47-65 only validates job lease; no date windows.
- Fix: Use IST date-boundary conversion, exclusive upper bound.

## G2-16-011-012  [P1] MISSING  facet F05  effort M
- Legacy: NotificationSchedulerService.java:245-254 assignment reminder due in [12h,36h).
- vNext now: scheduled-job-runner.ts:100-140 no deadline selection model.
- Fix: Implement exact 12h inclusive/36h exclusive threshold.

## G2-16-011-016  [P1] GAP  facet F06  effort M
- Legacy: NotificationSchedulerService.java:104,163,184,287 TTLs release5m, cleanup1h, reminders1h.
- vNext now: scheduled-job-runner.ts:101-105 TTL input generic; no job names registered.
- Fix: Bind exact job names/TTLs in deployed cron runner.

## G2-16-011-018  [P1] MISSING  facet F07  effort M
- Legacy: NotificationSchedulerService.java:140-150 per-row failed delivery sets FAILED and 500-char reason.
- vNext now: scheduled-job-runner.ts:137-139 work error propagates; no row-level failed status.
- Fix: Catch each notification delivery, persist FAILED and bounded reason.

## G2-16-011-020  [P1] MISSING  facet F08  effort M
- Legacy: NotificationSchedulerService.java:128-138 SSE best effort: failed SSE does not fail persisted SENT.
- vNext now: scheduled-job-runner.ts:137-139 generic executor no SSE.
- Fix: Push SSE after persistence; do not mark FAILED on socket failure.

## G2-16-011-026  [P1] MISSING  facet F11  effort M
- Legacy: NotificationSchedulerService.java:353-356 interview requires jobApplication/job, skips otherwise.
- vNext now: scheduled-job-runner.ts:100-140 no interview validation.
- Fix: Require valid application linkage before dispatch.

## G2-16-011-027  [P1] MISSING  facet F12  effort S
- Legacy: NotificationSchedulerService.java:205-208 skips CANCELLED/COMPLETED interview.
- vNext now: scheduled-job-runner.ts:100-140 no interview statuses.
- Fix: Filter cancelled/completed and verify round status.

## G2-16-011-028  [P1] MISSING  facet F12  effort M
- Legacy: NotificationSchedulerService.java:306-313 skips deleted content, no valid classId.
- vNext now: scheduled-job-runner.ts:100-140 no assignment selection.
- Fix: Respect soft-delete and class membership.

## G2-16-011-029  [P1] MISSING  facet F12  effort M
- Legacy: NotificationSchedulerService.java:237-242 deadline column first, JSON dueDate fallback.
- vNext now: scheduled-job-runner.ts:100-140 no due-date parser.
- Fix: Prioritize canonical dueAt, fallback to legacy payload when migrating.

## G2-16-011-035  [P1] MISSING  facet F15  effort M
- Legacy: NotificationSchedulerService.java:128-138 SSE pushed on scheduled release.
- vNext now: scheduled-job-runner.ts:1-141 no SSE delivery.
- Fix: Fan-out scheduled notifications after status commit.

## G2-16-011-040  [P1] MISSING  facet F19  effort M
- Legacy: NotificationSchedulerService.java:79-80 200 release per minute tick; backlog drains over ticks.
- vNext now: scheduled-job-runner.ts:100-140 no batching contract.
- Fix: Process due in 200-row bounded batches with backlog metrics.

## G2-16-011-041  [P1] GAP  facet F19  effort L
- Legacy: NotificationSchedulerService.java:316-332 nested class/learner iteration and per-item isolation.
- vNext now: scheduled-job-runner.ts:100-140 no work body.
- Fix: Avoid N+1 with batched target set but maintain per-learner isolation.

## G2-16-011-044  [P1] MISSING  facet F20  effort M
- Legacy: NotificationSchedulerService.java:140-150 records FAILED per row to prevent queue stall.
- vNext now: scheduled-job-runner.ts:137-139 generic exception propagation.
- Fix: Continue loop, record failures, alert persistent queue.

## G2-16-012-028  [P1] GAP  facet F12  effort M
- Legacy: SchedulerLockService.java:65-69 does not renew while task runs.
- vNext now: scheduled-job-runner.ts:119-135 renew available only if caller invokes; no automatic renewal.
- Fix: Provide explicit per-job renewal guard for tasks exceeding lease TTL, enforce per-send fencing.

## G2-16-012-041  [P1] GAP  facet F20  effort L
- Legacy: SchedulerLockService.java:65-69 cannot fence already-running old holder.
- vNext now: scheduled-job-runner.ts:119-139 exposes fence but only before callback and manual renew.
- Fix: Require fence checks before EACH irreversible send and durable recipient idempotency.

## G2-5-032-009  [P1] GAP  facet F04  effort M
- Legacy: Legacy release reports released/failed counts via logs. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:107-154`
- vNext now: vNext generic ScheduledJobRunResult does not itself persist per-recipient outcomes. `src/modules/operations/scheduled-job-runner.ts:43-45`
- Fix: Persist per-batch event counts and failure identifiers.

## G2-5-032-013  [P1] GAP  facet F06  effort M
- Legacy: Legacy daily deadlineToday cron 08:00 Asia/Kolkata, lease30m. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:42-43`
- vNext now: vNext runner validates TTL but cadence unspecified. `src/modules/operations/scheduled-job-lease.ts:35-49`, `src/modules/operations/scheduled-job-runner.ts:47-65`
- Fix: Schedule 08:00 IST using TZ-aware cron and 30m lease.

## G2-5-032-014  [P1] GAP  facet F06  effort M
- Legacy: Legacy offersExpiringSoon hourly, lease50m. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:45-46`
- vNext now: vNext generic lease TTL without hourly timing. `src/modules/operations/scheduled-job-runner.ts:47-65`
- Fix: Bind hourly offer warning job and enforce dedupe.
