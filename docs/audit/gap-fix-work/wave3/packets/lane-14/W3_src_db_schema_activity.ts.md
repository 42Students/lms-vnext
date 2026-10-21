# Work packet (wave 3): edit src/db/schema/activity.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l17-u026-notification-controller.md, docs/audit/gap2/lane-15/notification-service-impl.md, docs/audit/gap2/lane-18/notification-service.md

## G2-17-026-013  [P1] MISSING  facet F06  effort L
- Legacy: Optional `scheduledAt` accepts `yyyy-MM-dd HH:mm:ss` or ISO, null immediate; NotificationDTO.java:36-41; NotificationServiceImpl.java:103-125
- vNext now: No scheduledAt field on inbox notification schema; activity.ts:105-132
- Fix: Add scheduled composer input and persisted release state only if legacy send-later parity is in scope.

## G2-17-026-029  [P1] MISSING  facet F12  effort L
- Legacy: Scheduled future notices hidden until due and delayed broadcast; NotificationServiceImpl.java:139-165; NotificationRepository.java:130-144,179-186
- vNext now: No corresponding scheduling columns; activity.ts:105-135
- Fix: Document send-later parity decision, implement queue/worker/due-only visibility if retained.

## G2-15-011-072  [P1] MISSING  facet F22  effort L
- Legacy: Old delivery status/error/when columns. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Notification.java:88-105`)
- vNext now: No generic delivery_status/failed/error columns in notification table. (`src/db/schema/activity.ts:126-151`)
- Fix: Carry scheduled status/error to announcement/event lifecycle schema; audit migrations.

## G2-18-012-032  [P1] MISSING  facet F12  effort L
- Legacy: Legacy scheduled notification invisible until future release job (`NotificationServiceImpl.java:139-154`).
- vNext now: New inAppNotifications rows have only createdAt/readAt, no release visibility (`activity.ts:126-151`).
- Fix: Add scheduledAt/deliveryStatus with due worker and no early learner exposure.

## G2-18-012-056  [P1] MISSING  facet F21  effort L
- Legacy: Legacy scheduled release tied to separate notification delivery job, via `scheduledAt` (`NotificationServiceImpl.java:139-154`).
- vNext now: New no scheduledAt and no due worker in mapped service (`activity.ts:126-151`).
- Fix: Add worker for SCHEDULED→SENT/FAILED and fail-safe retries.
