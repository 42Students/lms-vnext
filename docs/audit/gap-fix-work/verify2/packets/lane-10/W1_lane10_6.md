# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-16-011-012 [P1] MISSING facet F05
- Verification: DEFERRED — target file located; correctness requires runtime or end-to-end lifecycle confirmation.
- Files: src/modules/operations/scheduled-job-runner.ts
- Legacy: NotificationSchedulerService.java:245-254 assignment reminder due in [12h,36h).
- Expected fix: Implement exact 12h inclusive/36h exclusive threshold.

## G2-16-011-016 [P1] GAP facet F06
- Verification: DEFERRED — target file located; correctness requires runtime or end-to-end lifecycle confirmation.
- Files: src/modules/operations/scheduled-job-runner.ts
- Legacy: NotificationSchedulerService.java:104,163,184,287 TTLs release5m, cleanup1h, reminders1h.
- Expected fix: Bind exact job names/TTLs in deployed cron runner.

## G2-16-011-018 [P1] MISSING facet F07
- Verification: DEFERRED — target file located; correctness requires runtime or end-to-end lifecycle confirmation.
- Files: src/modules/operations/scheduled-job-runner.ts
- Legacy: NotificationSchedulerService.java:140-150 per-row failed delivery sets FAILED and 500-char reason.
- Expected fix: Catch each notification delivery, persist FAILED and bounded reason.

## G2-16-011-020 [P1] MISSING facet F08
- Verification: DEFERRED — target file located; correctness requires runtime or end-to-end lifecycle confirmation.
- Files: src/modules/operations/scheduled-job-runner.ts
- Legacy: NotificationSchedulerService.java:128-138 SSE best effort: failed SSE does not fail persisted SENT.
- Expected fix: Push SSE after persistence; do not mark FAILED on socket failure.

## G2-16-011-026 [P1] MISSING facet F11
- Verification: DEFERRED — target file located; correctness requires runtime or end-to-end lifecycle confirmation.
- Files: src/modules/operations/scheduled-job-runner.ts
- Legacy: NotificationSchedulerService.java:353-356 interview requires jobApplication/job, skips otherwise.
- Expected fix: Require valid application linkage before dispatch.

## G2-16-011-027 [P1] MISSING facet F12
- Verification: DEFERRED — target file located; correctness requires runtime or end-to-end lifecycle confirmation.
- Files: src/modules/operations/scheduled-job-runner.ts
- Legacy: NotificationSchedulerService.java:205-208 skips CANCELLED/COMPLETED interview.
- Expected fix: Filter cancelled/completed and verify round status.

## G2-16-011-028 [P1] MISSING facet F12
- Verification: DEFERRED — target file located; correctness requires runtime or end-to-end lifecycle confirmation.
- Files: src/modules/operations/scheduled-job-runner.ts
- Legacy: NotificationSchedulerService.java:306-313 skips deleted content, no valid classId.
- Expected fix: Respect soft-delete and class membership.

## G2-16-011-029 [P1] MISSING facet F12
- Verification: DEFERRED — target file located; correctness requires runtime or end-to-end lifecycle confirmation.
- Files: src/modules/operations/scheduled-job-runner.ts
- Legacy: NotificationSchedulerService.java:237-242 deadline column first, JSON dueDate fallback.
- Expected fix: Prioritize canonical dueAt, fallback to legacy payload when migrating.

## G2-16-011-035 [P1] MISSING facet F15
- Verification: DEFERRED — target file located; correctness requires runtime or end-to-end lifecycle confirmation.
- Files: src/modules/operations/scheduled-job-runner.ts
- Legacy: NotificationSchedulerService.java:128-138 SSE pushed on scheduled release.
- Expected fix: Fan-out scheduled notifications after status commit.

## G2-16-011-040 [P1] MISSING facet F19
- Verification: DEFERRED — target file located; correctness requires runtime or end-to-end lifecycle confirmation.
- Files: src/modules/operations/scheduled-job-runner.ts
- Legacy: NotificationSchedulerService.java:79-80 200 release per minute tick; backlog drains over ticks.
- Expected fix: Process due in 200-row bounded batches with backlog metrics.

## G2-16-011-041 [P1] GAP facet F19
- Verification: DEFERRED — target file located; correctness requires runtime or end-to-end lifecycle confirmation.
- Files: src/modules/operations/scheduled-job-runner.ts
- Legacy: NotificationSchedulerService.java:316-332 nested class/learner iteration and per-item isolation.
- Expected fix: Avoid N+1 with batched target set but maintain per-learner isolation.

## G2-16-011-044 [P1] MISSING facet F20
- Verification: DEFERRED — target file located; correctness requires runtime or end-to-end lifecycle confirmation.
- Files: src/modules/operations/scheduled-job-runner.ts
- Legacy: NotificationSchedulerService.java:140-150 records FAILED per row to prevent queue stall.
- Expected fix: Continue loop, record failures, alert persistent queue.

## G2-16-012-028 [P1] GAP facet F12
- Verification: DEFERRED — target file located; correctness requires runtime or end-to-end lifecycle confirmation.
- Files: src/modules/operations/scheduled-job-runner.ts
- Legacy: SchedulerLockService.java:65-69 does not renew while task runs.
- Expected fix: Provide explicit per-job renewal guard for tasks exceeding lease TTL, enforce per-send fencing.

## G2-16-012-041 [P1] GAP facet F20
- Verification: DEFERRED — target file located; correctness requires runtime or end-to-end lifecycle confirmation.
- Files: src/modules/operations/scheduled-job-runner.ts
- Legacy: SchedulerLockService.java:65-69 cannot fence already-running old holder.
- Expected fix: Require fence checks before EACH irreversible send and durable recipient idempotency.

## G2-16-012-045 [P1] GAP facet F22
- Verification: DEFERRED — target file located; correctness requires runtime or end-to-end lifecycle confirmation.
- Files: src/modules/operations/postgres-scheduled-job-lease-store.ts
- Legacy: SchedulerLockService.java:80-91 legacy scheduled_job_lock fields lockUntil/by plus name.
- Expected fix: Register database schema with job_name PK, locked_until, locked_by, updated_at, fence.

## G2-16-028-020 [P1] GAP facet F07
- Verification: DEFERRED — no definitive file target established in one-pass lookup.
- Files: (none, new feature)
- Legacy: RepeatingItemEditor.jsx:262-274 rejects more than 500 rows with exact count; reports `Item N: Title required`.
- Expected fix: Add section-wide 500-row and per-item numbered field-error validation for a bulk editor.

## G2-17-015-022 [P1] GAP facet F10
- Verification: DEFERRED — target file located; correctness requires runtime or end-to-end lifecycle confirmation.
- Files: src/app/api/public/campaign-unsubscribe/route.ts
- Legacy: src/modules/messaging/tpo-campaign-unsubscribe-service.ts:29-55 — TPO recipient unsubscribe persists lead and recipient flags.
- Expected fix: Clarify recipient-scoped unsubscribe vs global email suppression; ensure no bypass across colleges.

## G2-17-015-032 [P1] GAP facet F15
- Verification: DEFERRED — target file located; correctness requires runtime or end-to-end lifecycle confirmation.
- Files: src/modules/operations/outbound-delivery-queue.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/EmailSuppressionEntity.java:13-31 — Suppression represents request not to contact again; entity itself sends no emails.
- Expected fix: Enforce at actual sender immediately before provider call, not only enqueue.

## G2-17-015-045 [P1] GAP facet F22
- Verification: DEFERRED — target file located; correctness requires runtime or end-to-end lifecycle confirmation.
- Files: src/modules/operations/outbound-delivery-queue.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/EmailSuppressionEntity.java:21-23 — Normalized email is raw PK, globally unique.
- Expected fix: Ensure dedicated HMAC secret is stable across key rotation.

## G2-17-010-001 [P1] GAP facet F01
- Verification: DEFERRED — target file located; correctness requires runtime or end-to-end lifecycle confirmation.
- Files: src/modules/operations/scheduled-job-lease.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:19-35 — Spring singleton scheduled component delegates to nine service dependencies, no direct UI route.
- Expected fix: Build deployment-owned invocation schedule/worker registry and persistent lease adapter.

## G2-17-010-002 [P1] GAP facet F01
- Verification: DEFERRED — target file located; correctness requires runtime or end-to-end lifecycle confirmation.
- Files: src/modules/operations/scheduled-job-lease.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:11-18 — Says exactly one replica via SchedulerLockService; outbox dispatcher excluded.
- Expected fix: Separate outbox worker from scheduled job lease and wire durable storage.

## G2-17-010-014 [P1] GAP facet F03
- Verification: DEFERRED — target file located; correctness requires runtime or end-to-end lifecycle confirmation.
- Files: src/modules/operations/scheduled-job-lease.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:33-35 — `once(name,lease,job)` uniformly wraps each handler.
- Expected fix: Wrap every scheduler handler with durable claim and fencing.

## G2-17-010-054 [P1] GAP facet F20
- Verification: DEFERRED — target file located; correctness requires runtime or end-to-end lifecycle confirmation.
- Files: src/modules/operations/scheduled-job-lease.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SchedulerLockService.java:44-60 — Legacy lock fails open under DB outage, may duplicate emails.
- Expected fix: Choose safe fail-closed with retry and dedupe rather than duplicates.

## G2-18-007-062 [P1] GAP facet F13
- Verification: DEFERRED — target file located; correctness requires runtime or end-to-end lifecycle confirmation.
- Files: src/app/(authenticated)/college/resources/page.tsx
- Legacy: Old failed refresh retains current rows, `Couldn't refresh resources` warning and Retry (`AdminResources.js:137-169,363-373`).
- Expected fix: Cache last scoped rows and show nonblocking error/Retry.

## G2-19-003-035 [P1] GAP facet F10
- Verification: DEFERRED — target file located; correctness requires runtime or end-to-end lifecycle confirmation.
- Files: src/app/(authenticated)/admin/course-progress/page.tsx, src/app/(authenticated)/admin/course-progress/students/page.tsx
- Legacy: GET /api/v1/admin/course-progress with courseId and classId `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:83-104`
- Expected fix: Expose selected class/course report with equivalent request params.
