# Work packet: edit src/modules/operations/outbound-delivery-queue.ts (part 2 of 2)

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/l12-u010-job-notification-helper.md, docs/audit/gap2/lane-5/u032-cross05-scheduled-jobs.md, docs/audit/gap2/lane-4/cross-notifications.md

## G2-12-010-042  [P1] GAP  facet F21  effort M
- Legacy: Legacy notes mail/SMS blocking timeouts in batch `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:47-55`
- vNext now: New queue stores encrypted intent, but no dispatch in queue function `src/modules/operations/outbound-delivery-queue.ts:13-16`; `src/modules/operations/outbound-delivery-queue.ts:96-113`
- Fix: Add worker out-of-band dispatch with delivery receipts and monitoring.

## G2-5-032-022  [P1] GAP  facet F07  effort M
- Legacy: Legacy release individual failure marks FAILED and retains SCHEDULED on persistence failure. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:98-154`
- vNext now: vNext outbox queues PENDING, no dispatcher/release service in mapped source. `src/modules/operations/outbound-delivery-queue.ts:16-22,104-117`
- Fix: Implement per-item FAILED/PENDING retries and release visibility.

## G2-5-032-031  [P1] GAP  facet F10  effort M
- Legacy: Legacy scheduled notification release queries due <=now batch200, status updates and SSE broadcast. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:107-154`
- vNext now: vNext outbound queue stores PENDING but does not dispatch/flip delivered. `src/modules/operations/outbound-delivery-queue.ts:104-117`
- Fix: Implement due send + SSE delivery and batch status transition.

## G2-5-032-034  [P1] GAP  facet F10  effort M
- Legacy: Legacy placement announcements sendDue every60s, batch50. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:189-197`
- vNext now: vNext outbound queue not announcement due-scheduler. `src/modules/operations/outbound-delivery-queue.ts:16-22`
- Fix: Bind due announcement publisher+undo hold window.

## G2-5-032-043  [P1] GAP  facet F13  effort M
- Legacy: Legacy no due notifications returns no effect; individual failures persist FAILED/SCHEDULED. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:107-154`
- vNext now: vNext queue PENDING with no dispatcher may appear stuck forever. `src/modules/operations/outbound-delivery-queue.ts:16-22`
- Fix: Show stalled queue as unavailable, not zero recipients.

## G2-5-032-045  [P1] GAP  facet F15  effort M
- Legacy: Legacy night-before interview email/in-app; morning same-day in-app only; recruiter digest email. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:60-70`
- vNext now: vNext outbound queue tracks EMAIL and other channels but no ready dispatcher. `src/modules/operations/outbound-delivery-queue.ts:16-22`
- Fix: Implement channel timing and recipient-specific suppression.

## G2-5-032-054  [P1] GAP  facet F19  effort M
- Legacy: Legacy scheduled release batch200 every60s indexed by delivery_status/scheduled_at. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:80-112`
- vNext now: vNext enqueue no sweep, therefore unbounded pending rows risk. `src/modules/operations/outbound-delivery-queue.ts:104-117`
- Fix: Implement batched due draining with backpressure and index.

## G2-5-032-055  [P1] GAP  facet F19  effort M
- Legacy: Legacy scheduled announcements batch50 every60s. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:189-197`
- vNext now: vNext no periodic drain guarantee. `src/modules/operations/outbound-delivery-queue.ts:16-22`
- Fix: Apply batch50 or measured throughput and watermark.

## G2-5-032-062  [P1] GAP  facet F21  effort M
- Legacy: Legacy recruiter digest calls external ZeptoMail through RecruiterMessageEmailService. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:69-70`
- vNext now: vNext outbound queue only enqueues and does not send provider. `src/modules/operations/outbound-delivery-queue.ts:16-22`
- Fix: Wire provider sender and no-duplicate digest outbox.

## G2-5-032-065  [P1] GAP  facet F22  effort M
- Legacy: Legacy notification indexes due release and status, scheduled_at. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:98-105`
- vNext now: vNext queue schema persists not_before/status PENDING but not connected to release. `src/modules/operations/outbound-delivery-queue.ts:104-117`
- Fix: Add due index/claim state and dispatch audit.

## G2-4-032-022  [P2] GAP  facet F07  effort M
- Legacy: Create 500 `Failed to create notification` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:82-84`)
- vNext now: Queue disabled throws OUTBOUND_QUEUE_DISABLED (`src/modules/operations/outbound-delivery-queue.ts:49-51`)
- Fix: Differentiate in-app create failure from offline external-channel queue, retry safely.
