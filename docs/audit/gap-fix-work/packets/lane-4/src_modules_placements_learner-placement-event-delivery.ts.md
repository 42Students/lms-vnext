# Work packet: edit src/modules/placements/learner-placement-event-delivery.ts

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/l12-u010-job-notification-helper.md, docs/audit/gap2/lane-12/job-application.md

## G2-12-010-001  [P1] GAP  facet F01  effort M
- Legacy: Legacy background helper called by job status mutation paths; @Async accepts numeric application ID + new status `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:47-62`
- vNext now: New delivery function requires transactional eventId, collegeId, membershipId, kind and subject `src/modules/placements/learner-placement-event-delivery.ts:9-16`
- Fix: Replace every legacy status transition caller with recorded in-transaction event producer; verify no missed transitions.

## G2-12-010-010  [P1] GAP  facet F05  effort M
- Legacy: Legacy helper uses latest non-CANCELLED interview by scheduledDate (fallback LocalDateTime.MIN) `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:190-194`
- vNext now: New delivery has no interview selection query `src/modules/placements/learner-placement-event-delivery.ts:13-35`
- Fix: Bind notice to correct persisted round/slot; use deterministic latest selection if only application available.

## G2-12-010-015  [P1] GAP  facet F07  effort M
- Legacy: Exceptions logged and swallowed, never block status transition `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:136-143`
- vNext now: New delivery writes in source transaction and may throw `src/modules/placements/learner-placement-event-delivery.ts:9-34`
- Fix: Decide atomic outbox vs best-effort policy explicitly; avoid losing valid mutation due to notification error.

## G2-12-010-020  [P1] MISSING  facet F10  effort M
- Legacy: Legacy dispatches via central event channels email/SMS/in-app `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:121-138`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:53-169`
- vNext now: New transactional function only delivers in-app `src/modules/placements/learner-placement-event-delivery.ts:29-34`
- Fix: Bind approved email/SMS channels to durable outbox with consent and DLT; don't claim sent before dispatch.

## G2-12-010-021  [P1] GAP  facet F10  effort M
- Legacy: Legacy @Async method refetches after committed batch mutation `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:47-61`
- vNext now: New notice writes in same SQL transaction `src/modules/placements/learner-placement-event-delivery.ts:9-12`
- Fix: Specify commit-time/send order and retry/idempotency for bulk applications.

## G2-12-010-023  [P1] GAP  facet F11  effort M
- Legacy: Legacy recipient uses learner classId and college template context `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:89-91`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:126-134`
- vNext now: New event requires active learner membership in matching college `src/modules/placements/learner-placement-event-delivery.ts:17-27`
- Fix: Clarify shared-organization job notifications across college boundaries.

## G2-12-010-030  [P1] MISSING  facet F15  effort M
- Legacy: Legacy SMS event registry APPLIED, SHORTLISTED, INTERVIEW, REJECTED etc `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/NotificationEventRegistry.java:61-70`
- vNext now: New recorded delivery only in-app, no SMS queue call `src/modules/placements/learner-placement-event-delivery.ts:29-34`
- Fix: Enumerate each event and ensure DLT-approved SMS trigger or documented intentional removal.

## G2-12-010-031  [P1] GAP  facet F15  effort M
- Legacy: Legacy email only for interview-scheduled/reminder/confirmed plus system events `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/NotificationEventRegistry.java:42-59`
- vNext now: New transactional stage helper never invokes email `src/modules/placements/learner-placement-event-delivery.ts:29-34`
- Fix: Apply narrowed urgent-email policy in durable sender and preserve operator-readable skipped reason.

## G2-12-010-041  [P1] GAP  facet F21  effort M
- Legacy: Legacy helper calls dispatcher, context resolver and optional interview and preferences repositories `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:32-45`
- vNext now: New direct in-app writes and optional DB10 outbound only as separate service `src/modules/placements/learner-placement-event-delivery.ts:3-12`; `src/modules/operations/outbound-delivery-queue.ts:13-23`
- Fix: Document per-status integration producer, worker, dispatcher and idempotency closure.

## G2-12-019-031  [P2] GAP  facet F08  effort S
- Legacy: Legacy offer accepted triggers HIRED status and notifications `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:104-112`
- vNext now: New offer release and status messaging through event delivery and separate offer object `src/db/schema/placements.ts:1526-1608` `src/modules/placements/learner-placement-event-delivery.ts:13-35`
- Fix: Restore exact offer status copy in learner timeline.

## G2-12-010-014  [P2] GAP  facet F07  effort M
- Legacy: No learner/job => warning and no dispatch `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:77-83`
- vNext now: No eligible membership => NO_ACTIVE_LEARNER skip `src/modules/placements/learner-placement-event-delivery.ts:17-28`
- Fix: Include reason codes for missing learner vs missing job vs revoked membership.
