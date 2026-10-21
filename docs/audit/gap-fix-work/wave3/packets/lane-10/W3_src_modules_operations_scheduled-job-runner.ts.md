# Work packet (wave 3): edit src/modules/operations/scheduled-job-runner.ts

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u011-notification-scheduler.md, docs/audit/gap2/lane-16/u012-scheduler-lock-service.md, docs/audit/gap2/lane-5/u032-cross05-scheduled-jobs.md

## G2-16-011-043  [P0] MISSING  facet F20  effort L
- Legacy: NotificationSchedulerService.java:102-104 minute tick, duplicate sends guarded by lease but no recipient dedupe.
- vNext now: scheduled-job-runner.ts:8-10 explicitly requires durable outbox/idempotency not implemented.
- Fix: Implement persisted idempotency key recipient+event+date/window before deployment.

## G2-16-011-050  [P0] MISSING  facet F23  effort L
- Legacy: NotificationSchedulerService.java:102-338 four independent scheduled jobs with intervals.
- vNext now: scheduled-job-runner.ts:1-141 lease executor only, no job registration.
- Fix: Integrate all four jobs into operational scheduler before claiming notification parity.

## G2-16-012-047  [P0] MISSING  facet F23  effort L
- Legacy: SchedulerLockService.java:32-103 functional distributed lease exists in old production.
- vNext now: scheduled-job-runner.ts:1-11,100-140 has contract/adapter but no live scheduler binding.
- Fix: Complete migration+runtime wiring+outbox, then prove actual job locks between replicas.

## G2-5-032-001  [P0] MISSING  facet F01  effort L
- Legacy: Legacy scheduling active in Spring `@Scheduled` on every backend replica, no manual entry. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:21-75`
- vNext now: vNext scheduled-job runner is interface only; no wired production trigger. `src/modules/operations/scheduled-job-runner.ts:1-14`, `docs/planning/database-parity-db10-scheduler-runner-handoff.md:9-16`
- Fix: Provision production scheduler tick endpoint/worker with persisted lease and every job binding.

## G2-5-032-030  [P0] MISSING  facet F10  effort L
- Legacy: Legacy each scheduled method calls domain service inside SchedulerLockService. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:42-73`
- vNext now: vNext runner has no adapter/bindings to real effects. `src/modules/operations/scheduled-job-runner.ts:100-141`, `docs/planning/database-parity-db10-scheduler-runner-handoff.md:14-16`
- Fix: Build DB lease adapter, persisted scheduler and complete job->service mapping.

## G2-16-011-001  [P1] MISSING  facet F01  effort L
- Legacy: NotificationSchedulerService.java:32-38 @Service scheduled background reminder component.
- vNext now: src/modules/operations/scheduled-job-runner.ts:100-140 pure executor, not a scheduler.
- Fix: Create actual recurring cron binding and invoke job functions.

## G2-16-011-002  [P1] MISSING  facet F01  effort L
- Legacy: NotificationSchedulerService.java:102-104 release scheduled every 60000ms.
- vNext now: scheduled-job-runner.ts:100-140 never schedules a tick.
- Fix: Register 1-minute release runner wired to real DB store.

## G2-16-011-005  [P1] MISSING  facet F02  effort L
- Legacy: NotificationSchedulerService.java:107-155 release flow lookup/deliver SSE/mark failure.
- vNext now: scheduled-job-runner.ts:100-140 calls arbitrary supplied work, no notification business logic.
- Fix: Wire persisted due list, release status and SSE failure tolerance.

## G2-16-011-013  [P1] MISSING  facet F05  effort L
- Legacy: NotificationSchedulerService.java:296-300 scans active assignment and quiz.
- vNext now: scheduled-job-runner.ts:100-140 no content query.
- Fix: Query active course assignments and quizzes, honor tenant/deletion.

## G2-16-011-014  [P1] MISSING  facet F05  effort L
- Legacy: NotificationSchedulerService.java:315-325 only learners in class who have not submitted.
- vNext now: scheduled-job-runner.ts:100-140 no recipient selection.
- Fix: Exclude submitted learner IDs and avoid reminders for inactive enrolments.

## G2-16-011-023  [P1] MISSING  facet F10  effort L
- Legacy: NotificationSchedulerService.java:102-155 scheduled release triggers repository update and SSE.
- vNext now: scheduled-job-runner.ts:100-140 only lease executor.
- Fix: Add release service, scheduler entrypoint and transaction.

## G2-16-011-025  [P1] MISSING  facet F11  effort L
- Legacy: NotificationSchedulerService.java:386-395 recipient identity resolved by learner context; email/phone/class ID.
- vNext now: scheduled-job-runner.ts:100-140 no authenticated recipient context.
- Fix: Resolve tenant/member scoped notifications, never unscoped PII.

## G2-16-011-046  [P1] MISSING  facet F21  effort L
- Legacy: NotificationSchedulerService.java:68-76 optional DB lease table.
- vNext now: scheduled-job-runner.ts:14-22 and postgres-scheduled-job-lease-store.ts:54-80 adapter authored but unregistered migration.
- Fix: Register lease schema and wire the live adapter.

## G2-16-011-047  [P1] MISSING  facet F22  effort L
- Legacy: NotificationSchedulerService.java:108-154 Notification.deliveryStatus SCHEDULED→SENT/FAILED, deliveredAt and deliveryError.
- vNext now: scheduled-job-runner.ts:100-140 no persisted notification writer.
- Fix: Add scheduled status/at/delivered error fields and writer transactional CAS.

## G2-16-012-001  [P1] MISSING  facet F01  effort L
- Legacy: SchedulerLockService.java:32-34 injectable Spring @Service consumed by four scheduled jobs.
- vNext now: scheduled-job-runner.ts:100-140 exported executor, not registered in a cron worker.
- Fix: Bind executor+store to each scheduling trigger (release, cleanup, interview, assignment) and verify deployed worker.

## G2-16-012-032  [P1] MISSING  facet F15  effort L
- Legacy: SchedulerLockService.java:14-20 protects outward reminder/SSE from duplicate execution.
- vNext now: scheduled-job-runner.ts:8-10 explicitly says recipient idempotency needed and not provided.
- Fix: Implement durable outbox and idempotency keys for irreversible messages.

## G2-5-032-002  [P1] MISSING  facet F01  effort L
- Legacy: Scheduled notifications release via Spring fixedDelay 60s. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:86-105`
- vNext now: vNext runner not connected to release job. `docs/planning/database-parity-db10-scheduler-runner-handoff.md:10-16`, `src/modules/operations/scheduled-job-runner.ts:100-106`
- Fix: Add 60-second equivalent external scheduler and due recipient dispatcher.
