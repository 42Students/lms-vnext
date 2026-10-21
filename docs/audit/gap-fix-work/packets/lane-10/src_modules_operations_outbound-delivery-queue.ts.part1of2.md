# Work packet: edit src/modules/operations/outbound-delivery-queue.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l18-u014-email-suppression-repository.md, docs/audit/gap2/lane-16/u011-notification-scheduler.md, docs/audit/gap2/lane-17/email-suppression-entity.md, docs/audit/gap2/lane-2/admin-sms-log-controller.md, docs/audit/gap2/lane-4/cross-notifications.md, docs/audit/gap2/lane-4/cross-third-party-integrations.md

## G2-18-014-023  [P1] GAP  facet F13  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/tpo/EmailSuppressionRepository.java:8 — table expected deployed by V161 without feature flag.
- vNext now: src/modules/operations/outbound-delivery-queue.ts:12-24 — DB10 queue runtime gated by DB10_OUTBOUND_READY=DB10_VERIFIED.
- Fix: Register migration and verify enabled sender/pre-send checks before release.

## G2-18-014-037  [P1] GAP  facet F21  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:20-23,93-111 — campaign email provider and tokenized unsubscribe.
- vNext now: src/modules/operations/outbound-delivery-queue.ts:12-18 — queue builder explicitly does not dispatch; dispatcher integration not proven.
- Fix: Wire provider delivery and recheck global suppression at final send boundary.

## G2-16-011-004  [P1] GAP  facet F02  effort L
- Legacy: NotificationSchedulerService.java:79-80 RELEASE_BATCH_SIZE=200, rows released independently.
- vNext now: src/modules/operations/outbound-delivery-queue.ts:1-30 outbound model and no direct notification release runner.
- Fix: Add bounded persisted due notification batch and per-row independent updates.

## G2-17-015-032  [P1] GAP  facet F15  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/EmailSuppressionEntity.java:13-31 — Suppression represents request not to contact again; entity itself sends no emails.
- vNext now: src/modules/operations/outbound-delivery-queue.ts:40-44 — Dispatch must recheck even after queued.
- Fix: Enforce at actual sender immediately before provider call, not only enqueue.

## G2-17-015-045  [P1] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/EmailSuppressionEntity.java:21-23 — Normalized email is raw PK, globally unique.
- vNext now: src/modules/operations/outbound-delivery-queue.ts:77-90 — Separate stable global email HMAC distinct from per-org hash.
- Fix: Ensure dedicated HMAC secret is stable across key rotation.

## G2-2-024-008  [P1] GAP  facet F04  effort M
- Legacy: AdminSmsLogController.java:74-83 response content,totalElements,totalPages,number,size,note
- vNext now: src/modules/operations/outbound-delivery-queue.ts:26-29 returns queued/already queued/suppressed only
- Fix: Return actual attempt history and explicit provider-acceptance caveat.

## G2-2-024-022  [P1] GAP  facet F10  effort M
- Legacy: SmsDeliveryLogRepository.java:18-24 search suffix and purpose via DB
- vNext now: src/modules/operations/outbound-delivery-queue.ts:101-147 stores pending intents, not provider outcome
- Fix: Add dispatched-attempt event rows separate from queue state.

## G2-2-024-026  [P1] GAP  facet F12  effort M
- Legacy: SmsDeliveryLog.java:36-43 statuses SENT/FAILED are provider acceptance
- vNext now: src/modules/operations/outbound-delivery-queue.ts:26-29 status QUEUED/ALREADY_QUEUED/SUPPRESSED
- Fix: Separate send-intent state from actual provider acceptance and failure.

## G2-2-024-045  [P1] GAP  facet F22  effort M
- Legacy: V134__sms_delivery_log.sql:20-40 stores purpose,suffix,status,providerMessageId,errorSummary,collegeId,createdAt + indexes
- vNext now: src/modules/operations/outbound-delivery-queue.ts:103-117 encrypted outbound_messages state PENDING
- Fix: Register separate sanitized SMS send-attempt table/indexes; don't expose encrypted payload.

## G2-4-032-006  [P1] MISSING  facet F02  effort M
- Legacy: Scheduled notifications hidden until release (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:86-104`)
- vNext now: DB10 outbox disabled and not an in-app scheduled-notification release (`src/modules/operations/outbound-delivery-queue.ts:12-24`)
- Fix: Implement timed in-app publication worker or explicitly drop scheduled notices.

## G2-4-032-031  [P1] MISSING  facet F10  effort M
- Legacy: Student emails urgent interview/system only; TRAI SMS selected job statuses (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/NotificationEventRegistry.java:50-70`)
- vNext now: Generic outbound queue not yet enabled for routine sends (`src/modules/operations/outbound-delivery-queue.ts:12-24`)
- Fix: Wire per-event email/SMS channels to approved provider templates and owner policy.

## G2-4-032-042  [P1] GAP  facet F12  effort M
- Legacy: Offer/Hired and interview cancel/reschedule in-app only, no provider templates (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/NotificationEventRegistry.java:42-49`)
- vNext now: Generic queue not enabled (`src/modules/operations/outbound-delivery-queue.ts:12-24`)
- Fix: Ensure offer/hired/cancel/reschedule at least in-app; don't invent unsupported emails.

## G2-4-032-050  [P1] MISSING  facet F15  effort M
- Legacy: Explicit urgent EMAIL_EVENTS 6, TRAI_SMS_EVENTS 6, in-app job/course15 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/NotificationEventRegistry.java:50-70`)
- vNext now: DB10 outbound queue explicitly does not dispatch email/SMS (`src/modules/operations/outbound-delivery-queue.ts:12-24`)
- Fix: Build event-by-event parity table and live provider sends, suppression, timing.

## G2-4-032-063  [P1] MISSING  facet F19  effort M
- Legacy: release scheduled in batches200 per minute (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:79-111`)
- vNext now: Disabled durable queue, no in-app release worker (`src/modules/operations/outbound-delivery-queue.ts:12-24`)
- Fix: Implement bounded release worker and indexes.

## G2-4-032-069  [P1] GAP  facet F21  effort M
- Legacy: Central in-app/Zepto/TRAI routing (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:23-50`)
- vNext now: DB10 queue boundary disabled, provider dispatch elsewhere (`src/modules/operations/outbound-delivery-queue.ts:12-24`)
- Fix: Centralize supported provider send and durable receipts while honoring dev safety.

## G2-4-032-070  [P1] MISSING  facet F21  effort M
- Legacy: Background send-later release with failure record (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:102-155`)
- vNext now: No active deliverer for generic outbox (`src/modules/operations/outbound-delivery-queue.ts:12-24`)
- Fix: Add scheduled worker and per-message retry/failed audit.

## G2-4-033-044  [P1] GAP  facet F19  effort M
- Legacy: Legacy dispatcher synchronous mail retries inside event dispatch `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:123-148`
- vNext now: New outbound queue explicitly disabled unless DB10 ready `src/modules/operations/outbound-delivery-queue.ts:13-16`
- Fix: Enable durable sender and bounded retries before production bulk email/SMS.

## G2-4-033-053  [P1] GAP  facet F22  effort M
- Legacy: Legacy SMS persisted delivery log on missing job DLT `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:96-100`
- vNext now: New outbound queue writes persistent outbox only when enabled `src/modules/operations/outbound-delivery-queue.ts:96-113`
- Fix: Compare SmsDeliveryLog schema to durable provider attempts with exact status/attempt metadata.

## G2-12-010-037  [P1] GAP  facet F19  effort M
- Legacy: Legacy outbound retry may sleep via dispatcher `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:47-51`
- vNext now: New outbound queue intentionally disabled until schema ready `src/modules/operations/outbound-delivery-queue.ts:13-23`
- Fix: Implement verified sender worker, backoff, queue control and dead-letter count.

## G2-12-010-041  [P1] GAP  facet F21  effort M
- Legacy: Legacy helper calls dispatcher, context resolver and optional interview and preferences repositories `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:32-45`
- vNext now: New direct in-app writes and optional DB10 outbound only as separate service `src/modules/placements/learner-placement-event-delivery.ts:3-12`; `src/modules/operations/outbound-delivery-queue.ts:13-23`
- Fix: Document per-status integration producer, worker, dispatcher and idempotency closure.
