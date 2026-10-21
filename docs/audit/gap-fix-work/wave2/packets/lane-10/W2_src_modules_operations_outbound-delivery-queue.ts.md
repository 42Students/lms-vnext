# Work packet (wave 2): edit src/modules/operations/outbound-delivery-queue.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/email-suppression-entity.md, docs/audit/gap2/lane-2/admin-sms-log-controller.md, docs/audit/gap2/lane-4/cross-notifications.md, docs/audit/gap2/lane-5/u032-cross05-scheduled-jobs.md

## G2-17-015-009  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/tpo/EmailSuppressionRepository.java:7-9 — Repository JpaRepository supports find by email PK; no list sorting method.
- vNext now: src/modules/operations/outbound-delivery-queue.ts:117-145 — Dispatch SQL performs active suppression existence lookup by hash.
- Fix: Ensure production dispatch uses indexed HMAC lookup before every email.

## G2-2-024-039  [P2] GAP  facet F19  effort M
- Legacy: SmsDeliveryLogRepository.java:18-24 suffix/purpose composite query and newest ordering
- vNext now: src/modules/operations/outbound-delivery-queue.ts:101-147 idempotency-key SQL; not a read index
- Fix: Create indexed recent attempt table with suffix+purpose filter.

## G2-4-032-016  [P2] MISSING  facet F05  effort M
- Legacy: Release job takes first200 scheduled rows (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:107-111`)
- vNext now: Outbound queue gate and no release worker (`src/modules/operations/outbound-delivery-queue.ts:12-24`)
- Fix: Design bounded scheduled-notification queue with stable order.

## G2-5-032-047  [P2] GAP  facet F15  effort M
- Legacy: Legacy due announcements scheduled every minute, no SMS. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:189-197`
- vNext now: vNext queue supports outbound templates but not scheduled publisher here. `src/modules/operations/outbound-delivery-queue.ts:16-22`
- Fix: Honor DLT no-free-text-SMS and schedule announcement channel.

## G2-5-032-050  [P2] GAP  facet F17  effort M
- Legacy: Legacy release logs nonvisual; accessible to recipients via SSE notifications. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:86-105`
- vNext now: vNext pending outbox has no delivered notifications. `src/modules/operations/outbound-delivery-queue.ts:16-22`
- Fix: Confirm notifications accessible once dispatcher added.
