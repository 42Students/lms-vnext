# Work packet (wave 3): edit src/modules/activity/notification-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l17-u026-notification-controller.md, docs/audit/gap2/lane-15/notification-service-impl.md, docs/audit/gap2/lane-18/notification-service.md, docs/audit/gap2/lane-2/l17-u026-notification-controller.md

## G2-17-026-049  [P1] MISSING  facet F23  effort L
- Legacy: Legacy supports scheduled notice, class/course audience, staff update/delete and SSE; NotificationController.java:59-288
- vNext now: No direct analogue in reviewed own-inbox service; notification-service.ts:132-538
- Fix: Document intentional exclusions explicitly with product owner before closing parity; otherwise plan implementation.

## G2-15-011-035  [P1] MISSING  facet F10  effort L
- Legacy: PUT update and DELETE /delete/{id}; soft delete events. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:178-234`)
- vNext now: Only recipient read mutations; no generic update/delete notification writer here. (`src/modules/activity/notification-service.ts:365-468`)
- Fix: Confirm admin CRUD equivalents and implement missing edit/delete + safe downstream updates.

## G2-18-012-019  [P1] MISSING  facet F07  effort L
- Legacy: Legacy scheduledAt accepts `yyyy-MM-dd HH:mm:ss` and ISO with stripped Z; invalid throws specific error (`NotificationServiceImpl.java:103-125`).
- vNext now: New notification schema has no scheduledAt input (`notification-service.ts:34-58`).
- Fix: Implement validated future scheduled release with explicit timezone and exact invalid-input feedback.

## G2-17-026-061  [P1] MISSING  facet F21  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:44-150 scheduled-notification release job every minute with lock/batch and row-level failure
- vNext now: src/modules/activity/notification-service.ts:140-244 immediate insert, no scheduling integration
- Fix: Build scheduled release job with safe lease, retries and per-notice failure tracking
