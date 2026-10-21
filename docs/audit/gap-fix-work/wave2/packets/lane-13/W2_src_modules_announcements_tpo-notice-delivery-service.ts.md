# Work packet (wave 2): edit src/modules/announcements/tpo-notice-delivery-service.ts

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/notification-service-impl.md, docs/audit/gap2/lane-3/l12-u023-tpo-announcement-controller.md, docs/audit/gap2/lane-3/l19-u023-learner-announcement-controller.md, docs/audit/gap2/lane-17/tpo-scheduled-jobs.md

## G2-15-011-021  [P2] GAP  facet F06  effort M
- Legacy: Optional scheduledAt free string, blank immediate. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/NotificationDTO.java:37-41`)
- vNext now: New TPO source uses scheduledAt/expiry; generic notification delivery no schedule input. (`src/modules/announcements/tpo-notice-delivery-service.ts:21-30`)
- Fix: Expose schedule form field and default immediate on relevant announcement composer.

## G2-15-011-044  [P2] GAP  facet F12  effort M
- Legacy: Accepts yyyy-MM-dd HH:mm:ss or ISO then strips Z before local parsing. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:112-125`)
- vNext now: New timestamptz comparisons against now; explicit timestamp semantics. (`src/modules/announcements/tpo-notice-delivery-service.ts:25-30`)
- Fix: Normalize legacy local scheduleAt into IST instants and document cross-timezone conversion.

## G2-15-011-045  [P2] GAP  facet F12  effort M
- Legacy: Past or omitted scheduledAt sends immediately. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:138-154`)
- vNext now: New TPO requires 30s hold even when no schedule. (`src/modules/announcements/tpo-notice-delivery-service.ts:11-30`)
- Fix: Document intentional undo hold vs instant legacy delivery; implement other producers' immediate release.

## G2-15-011-046  [P2] GAP  facet F12  effort M
- Legacy: Release due batch max200 every 60 seconds under cross-replica lock. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:102-154`)
- vNext now: New TPO due scan batch100 with 30s hold. (`src/modules/announcements/tpo-notice-delivery-service.ts:15-39`)
- Fix: Compare cadence/batch limits/lock to avoid time-sensitive late delivery.

## G2-15-011-062  [P2] GAP  facet F19  effort M
- Legacy: Legacy due batch size 200. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:80-110`)
- vNext now: New notice delivery scans up to100 due rows. (`src/modules/announcements/tpo-notice-delivery-service.ts:37-39`)
- Fix: Load test release throughput and backlog delay; adjust pagination.

## G2-15-011-064  [P2] GAP  facet F20  effort M
- Legacy: ISO schedule strings with Z stripped and interpreted LocalDateTime. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:112-125`)
- vNext now: New timestamp comparisons use instant Date. (`src/modules/announcements/tpo-notice-delivery-service.ts:21-30`)
- Fix: Audit IST conversion of legacy scheduled notices, daylight shifts and rounding.

## G2-12-023-037  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:189-197`
- vNext now: `src/modules/announcements/tpo-notice-delivery-service.ts:11-38`
- Fix: Legacy @Scheduled fixedDelay60s sender scans up to50; vNext authenticated scheduler scans due after 30s and idempotent delivery event.

## G2-12-023-044  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:198-208`
- vNext now: `src/modules/announcements/tpo-notice-delivery-service.ts:11-38`
- Fix: Legacy holds notices in outbox undo group and cancels upon undo; vNext only delivers after createdAt+30s and physically deletes notification rows on later deletion.

## G2-12-023-052  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:159-186`
- vNext now: `src/modules/announcements/tpo-notice-delivery-service.ts:59-79`
- Fix: Legacy queues in-app learner notices via outbox, vNext sends inAppNotifications with event dedupe and college member set. Verify audience and count.

## G2-19-023-039  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:263-277`
- vNext now: `src/modules/announcements/tpo-notice-delivery-service.ts:11-85`
- Fix: Legacy TPO outbox sends APP notices and hourly reminders, new authenticated due scheduler/inAppNotification idempotency.

## G2-19-023-052  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:263-277`
- vNext now: `src/modules/announcements/tpo-notice-delivery-service.ts:11-85`
- Fix: Legacy placement announcement outbox with learner APP target; new scheduler 30s hold, inAppNotifications and activityEvents.

## G2-17-010-050  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:38-40 — Comments name deadline-today and shortlist timing.
- vNext now: src/modules/announcements/tpo-notice-delivery-service.ts:11-15 — Generic `deliverDueTpoNotices` name alone.
- Fix: Name operators/metrics by exact job purpose; no user-visible copy.
