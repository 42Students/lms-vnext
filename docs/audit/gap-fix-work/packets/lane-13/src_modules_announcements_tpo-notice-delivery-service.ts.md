# Work packet: edit src/modules/announcements/tpo-notice-delivery-service.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/notification-service-impl.md, docs/audit/gap2/lane-17/tpo-scheduled-jobs.md, docs/audit/gap2/lane-3/l12-u023-tpo-announcement-controller.md

## G2-15-011-043  [P1] GAP  facet F12  effort M
- Legacy: SCHEDULED/SENT/FAILED status constants; future time only schedules. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:98-104`)
- vNext now: New TPO uses eligible createdAt and scheduledAt/expiry. (`src/modules/announcements/tpo-notice-delivery-service.ts:25-30`)
- Fix: Preserve common status and release semantics across all notification producers.

## G2-15-011-050  [P1] GAP  facet F13  effort L
- Legacy: Scheduler failures record FAILED/deliveryError, replay option. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:107-154`)
- vNext now: New TPO due deliveries return counts, no persisted FAILED per inbox row. (`src/modules/announcements/tpo-notice-delivery-service.ts:41-85`)
- Fix: Expose per-announcement release failures and retry control.

## G2-17-010-005  [P1] MISSING  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:48-49 — Shortlist due tomorrow daily 08:00 IST.
- vNext now: src/modules/announcements/tpo-notice-delivery-service.ts:15-37 — Due notices only; no shortlist selection reminder generator here.
- Fix: Create next-day shortlist notices with dedupe.

## G2-17-010-010  [P1] MISSING  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:64-66 — Interview morning 08:00 IST only in app.
- vNext now: src/modules/announcements/tpo-notice-delivery-service.ts:71-85 — Announcement delivery has generic in-app notices not interview-specific.
- Fix: Add morning interview-only in-app job.

## G2-12-023-045  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:25-30`
- vNext now: `src/modules/announcements/tpo-notice-delivery-service.ts:59-79`
- Fix: Legacy targeted student announcement reaches learners, but vNext COLLEGE broadcast selects all active college members without learner role filter—potential staff notification parity/privacy risk.

## G2-12-023-073  [P1] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:25-30`
- vNext now: `src/modules/announcements/tpo-notice-delivery-service.ts:59-79`
- Fix: TPO notice audience type COLLEGE must not be assumed equivalent to learners-only; ensure faculty/admin visibility matches owner intention.

## G2-15-011-026  [P2] GAP  facet F07  effort S
- Legacy: Invalid scheduleAt throws scheduledAt must be yyyy-MM-dd HH:mm:ss. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:112-125`)
- vNext now: New scheduling comparison uses timestamp columns, no matching legacy parse error. (`src/modules/announcements/tpo-notice-delivery-service.ts:21-30`)
- Fix: Normalize timezone-aware schedule input, provide corresponding invalid-date error.

## G2-17-010-025  [P2] GAP  facet F08  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:42-73 — Sends operational notifications via delegated services; no toast itself.
- vNext now: src/modules/announcements/tpo-notice-delivery-service.ts:73-85 — Generic notice pushes in-app event with redirect.
- Fix: Preserve per-job wording and notification type.
