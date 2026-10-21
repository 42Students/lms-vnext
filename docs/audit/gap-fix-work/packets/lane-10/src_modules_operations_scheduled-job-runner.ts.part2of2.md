# Work packet: edit src/modules/operations/scheduled-job-runner.ts (part 2 of 2)

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u032-cross05-scheduled-jobs.md, docs/audit/gap2/lane-16/u011-notification-scheduler.md, docs/audit/gap2/lane-16/u012-scheduler-lock-service.md

## G2-5-032-015  [P1] GAP  facet F06  effort M
- Legacy: Legacy shortlistDueTomorrow daily 08:00 IST lease30m. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:48-49`
- vNext now: vNext job queue has no named shortlist timer. `src/modules/operations/scheduled-job-runner.ts:47-65`
- Fix: Schedule + restrict next-day shortlist window.

## G2-5-032-016  [P1] GAP  facet F06  effort M
- Legacy: Legacy withdrawal escalation every15m lease12m. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:51-52`
- vNext now: vNext generic runner has no actual escalation recurrence. `src/modules/operations/scheduled-job-runner.ts:47-65`
- Fix: Schedule 15-minute escalation and verify 24-hour decision window.

## G2-5-032-017  [P1] GAP  facet F06  effort M
- Legacy: Legacy finalise external acceptances every30m lease25m. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:54-55`
- vNext now: vNext runner no 30-minute auto acceptance binding. `src/modules/operations/scheduled-job-runner.ts:47-65`
- Fix: Connect external offer finalizer with idempotent CAS.

## G2-5-032-018  [P1] GAP  facet F06  effort M
- Legacy: Legacy recruiter invite reminders daily09:00 IST lease30m. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:57-58`
- vNext now: vNext not wired to invite reminder cron. `src/modules/operations/scheduled-job-runner.ts:47-65`
- Fix: Add 09:00 IST schedule and per-invite reminder dedupe.

## G2-5-032-019  [P1] GAP  facet F06  effort M
- Legacy: Legacy interview reminders prior evening19:00 and same-day08:00 IST, email only previous night. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:61-66`
- vNext now: vNext no shared two-stage interview scheduling contract in runner. `src/modules/operations/scheduled-job-runner.ts:47-65`
- Fix: Implement 19:00+08:00 windows and channel split.

## G2-5-032-020  [P1] GAP  facet F06  effort M
- Legacy: Legacy recruiter unread digest every5m, initial90s, lease4m. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:69-70`
- vNext now: vNext no 5m trigger in generic runner. `src/modules/operations/scheduled-job-runner.ts:47-65`
- Fix: Wire 5-minute recruiter digest and 90-second warmup.

## G2-5-032-039  [P1] GAP  facet F12  effort M
- Legacy: Legacy assignment reminder daily09:00 server timezone (UTC JVM). `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:285-286`
- vNext now: vNext no corresponding daily assignment timer. `src/modules/operations/scheduled-job-runner.ts:47-65`
- Fix: Schedule and fix desired IST wall clock after policy review.

## G2-5-032-040  [P1] GAP  facet F12  effort M
- Legacy: Legacy deploy health every5m after3m warmup, log poll every2m after1m. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/DeployHealthMonitor.java:44-50`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogAlertingService.java:85-91`
- vNext now: vNext runner no poll schedule defaults. `src/modules/operations/scheduled-job-runner.ts:47-65`
- Fix: Bind alert/deploy monitor cadences and initial delays.

## G2-5-032-041  [P1] GAP  facet F12  effort M
- Legacy: Legacy daily + Monday weekly logs digest at 03:30 UTC (09:00 IST). `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogDigestService.java:139-156`
- vNext now: vNext no digest schedule. `src/modules/operations/scheduled-job-runner.ts:47-65`
- Fix: Implement twice named UTC/IST digest schedules.

## G2-5-032-046  [P1] GAP  facet F15  effort M
- Legacy: Legacy interview scheduler converts tomorrow India local day to UTC half-open range. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:182-200`
- vNext now: vNext lacks interview reminder job. `src/modules/operations/scheduled-job-runner.ts:47-65`
- Fix: Query interviews using Asia/Kolkata calendar window.

## G2-5-032-063  [P1] GAP  facet F21  effort M
- Legacy: Legacy scheduled announcement uses backend DB worker, no external cloud scheduler. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:189-197`
- vNext now: vNext requires Cloud Scheduler/Cloud Run job or equivalent trigger. `src/modules/operations/scheduled-job-runner.ts:100-141`
- Fix: Document deployment, IAM token and retry cadence.

## G2-16-011-017  [P2] GAP  facet F07  effort M
- Legacy: NotificationSchedulerService.java:109-115 release lookup exception logs and returns.
- vNext now: scheduled-job-runner.ts:87-92 store exception converts to LEASE_STORE_UNAVAILABLE.
- Fix: Report selection query failure distinctly from lock outage.

## G2-16-011-019  [P2] MISSING  facet F07  effort S
- Legacy: NotificationSchedulerService.java:271-275 invalid date warn, skip assignment only.
- vNext now: scheduled-job-runner.ts:47-65 lease input validation only.
- Fix: Implement safe invalid due-date handling per item, continue batch.

## G2-16-012-020  [P2] GAP  facet F08  effort S
- Legacy: SchedulerLockService.java:58-59 warning says scheduled-job lock unavailable, running anyway.
- vNext now: scheduled-job-runner.ts:82-92 generic LEASE_STORE_UNAVAILABLE, no log.
- Fix: Add ops-facing log with job name, typed failure (without SQL secret).

## G2-5-032-025  [P2] GAP  facet F07  effort M
- Legacy: Legacy cleanup errors logged but do not fail request serving. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/TokenBlocklistCleanupService.java:26-34`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AuthHandoffTokenCleanupService.java:26-32`
- vNext now: vNext runner error throws LEASE_STORE_UNAVAILABLE, no surrounding operation alert. `src/modules/operations/scheduled-job-runner.ts:82-95`
- Fix: Catch at scheduler boundary, log failure with alert and retry next tick.

## G2-16-011-021  [P3] GAP  facet F08  effort S
- Legacy: NotificationSchedulerService.java:194-224 interview job logs start, found count, completion/error.
- vNext now: scheduled-job-runner.ts:100-140 no job-specific counters.
- Fix: Add safe per-tick metrics and actionable failures.

## G2-16-012-021  [P3] GAP  facet F08  effort S
- Legacy: SchedulerLockService.java:62-64 debug skip held.
- vNext now: scheduled-job-runner.ts:107-109 typed skip result only.
- Fix: Log/metric contention with normal severity.
