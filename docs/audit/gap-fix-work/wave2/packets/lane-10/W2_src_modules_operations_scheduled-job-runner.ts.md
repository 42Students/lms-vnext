# Work packet (wave 2): edit src/modules/operations/scheduled-job-runner.ts

16 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u011-notification-scheduler.md, docs/audit/gap2/lane-16/u012-scheduler-lock-service.md, docs/audit/gap2/lane-5/u032-cross05-scheduled-jobs.md

## G2-16-011-003  [P2] MISSING  facet F01  effort M
- Legacy: NotificationSchedulerService.java:161-164 cleanup Sunday 02:00 JVM timezone.
- vNext now: scheduled-job-runner.ts:100-140 no cleanup handler.
- Fix: Schedule 90-day soft-delete weekly with explicit timezone decision.

## G2-16-011-030  [P2] MISSING  facet F13  effort M
- Legacy: NotificationSchedulerService.java:256-279 supports SQL datetime/date-only/ISO offset and skips invalid.
- vNext now: scheduled-job-runner.ts:100-140 no parser or failure isolation.
- Fix: Implement robust IST due parser and invalid-date warning.

## G2-16-011-031  [P2] MISSING  facet F13  effort S
- Legacy: NotificationSchedulerService.java:116-118 no due scheduled is healthy empty batch.
- vNext now: scheduled-job-runner.ts:100-140 no release query.
- Fix: Expose no-due no-op without failure or notification.

## G2-16-011-048  [P2] MISSING  facet F22  effort M
- Legacy: NotificationSchedulerService.java:167-170 soft-deletes notifications older than90 days.
- vNext now: scheduled-job-runner.ts:100-140 no cleanup task.
- Fix: Implement indexed notification soft-delete sweep weekly.

## G2-16-011-049  [P2] MISSING  facet F22  effort M
- Legacy: NotificationSchedulerService.java:237-242 LessonContents.deadline canonical, contentDataDTO.dueDate fallback.
- vNext now: scheduled-job-runner.ts:100-140 no lesson content schema read.
- Fix: Wire normalized lesson dueAt, support legacy fallback only for migration.

## G2-16-012-002  [P2] GAP  facet F01  effort M
- Legacy: SchedulerLockService.java:49-70 synchronous `runExclusively` wraps business task and returns void.
- vNext now: scheduled-job-runner.ts:100-140 async executeScheduledJobWithLease returns ran/result union.
- Fix: Wrap async executor at job boundary and handle held/failure outcomes instead of silently discarding.

## G2-16-012-008  [P2] GAP  facet F04  effort S
- Legacy: SchedulerLockService.java:94-101 `instanceId` from hostname, fallback unknown.
- vNext now: scheduled-job-runner.ts:100-105 requires supplied holderId with length<=120.
- Fix: Generate stable per-process instance ID; bound and verify across pods/restarts.

## G2-5-032-006  [P2] GAP  facet F03  effort M
- Legacy: Legacy ten task names, 08:00 deadlines/shortlist, 09:00 invites, 19:00 interview, hourly offers etc. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:38-73`
- vNext now: vNext runner accepts generic job name without human-facing catalogue. `src/modules/operations/scheduled-job-runner.ts:37-45`
- Fix: Define exact canonical named job registry with description, cadence, next-run.

## G2-5-032-007  [P2] GAP  facet F03  effort M
- Legacy: Legacy release, cleanup, interview and assignment names in services. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:102-105,161-182,285-286`
- vNext now: vNext no job-specific admin controls or typed status/count per task. `src/modules/operations/scheduled-job-runner.ts:37-45`
- Fix: Add read-only operator job health counters.

## G2-5-032-011  [P2] GAP  facet F05  effort M
- Legacy: Legacy tasks scheduled in distinct fixedDelay/crons; no filter/sort UI. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:42-73`
- vNext now: vNext runner invoked externally; no built-in cron list or history pagination. `src/modules/operations/scheduled-job-runner.ts:100-141`
- Fix: Add job registry inspection with last run sorted descending for operators.

## G2-5-032-038  [P2] GAP  facet F12  effort M
- Legacy: Legacy notification cleanup Sunday 02:00 server timezone. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:161-174`
- vNext now: vNext has no weekly cleanup job schedule. `src/modules/operations/scheduled-job-runner.ts:47-65`
- Fix: Schedule weekly cleanup timezone explicitly.

## G2-5-032-052  [P2] GAP  facet F18  effort M
- Legacy: Legacy canonical names `deadlineToday`,`offersExpiringSoon`,`shortlistDueTomorrow`, etc. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:42-73`
- vNext now: vNext runner accepts arbitrary jobName, no mapping. `src/modules/operations/scheduled-job-runner.ts:37-45`
- Fix: Use literal job-name contracts to correlate audits.

## G2-16-012-006  [P3] GAP  facet F03  effort S
- Legacy: SchedulerLockService.java:62-64 held lock skips, debug log.
- vNext now: scheduled-job-runner.ts:107-109 yields HELD_BY_OTHER_WORKER without logging.
- Fix: Emit bounded skip metrics/logging from caller with jobName.

## G2-16-012-036  [P3] GAP  facet F18  effort S
- Legacy: SchedulerLockService.java:58-59 warning `Scheduled-job lock unavailable ... running anyway`.
- vNext now: scheduled-job-runner.ts:24-35 throws LEASE_STORE_UNAVAILABLE enum, no human text.
- Fix: Map typed error to operational explanation, do not copy dangerous fail-open promise.

## G2-16-012-044  [P3] GAP  facet F21  effort S
- Legacy: SchedulerLockService.java:94-101 host resolution fallback unknown.
- vNext now: scheduled-job-runner.ts:55-58 holderId nonblank max120 and no control chars.
- Fix: Set bounded worker identification, log missing host for ops.

## G2-5-032-053  [P3] GAP  facet F18  effort S
- Legacy: Legacy messages `Scheduled-notification release: N sent, M failed`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:107-154`
- vNext now: vNext generic results omit that summary. `src/modules/operations/scheduled-job-runner.ts:43-45`
- Fix: Match operator log format per task.
