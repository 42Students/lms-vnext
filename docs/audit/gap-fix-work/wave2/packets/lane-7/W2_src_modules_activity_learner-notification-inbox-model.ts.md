# Work packet (wave 2): edit src/modules/activity/learner-notification-inbox-model.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u004-learner-notifications.md

## G2-18-004-056  [P2] GAP  facet F11  effort M
- Legacy: Legacy external assessment target only http(s), opens new window noopener noreferrer. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:72-83`
- vNext now: vNext external announcement CTA insists https and no credentials, personal links internal. `src/components/activity/learner-notifications-inbox.tsx:67-75`, `src/modules/activity/learner-notification-inbox-model.ts:20-25`
- Fix: Map safe http legacy assessment case through reviewed redirect or disallow with explicit reason.

## G2-18-004-057  [P2] GAP  facet F12  effort M
- Legacy: Legacy announcements categories by notification_type JOB/COURSE or course ID, with fallback announcement. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:135-144`
- vNext now: vNext categories derived from event.module plus announcement source. `src/modules/activity/learner-notification-category.ts:1-40`, `src/modules/activity/learner-notification-inbox-model.ts:26-35`
- Fix: Crosswalk legacy notification_type to vNext module strings; test all producer cases.

## G2-18-004-058  [P2] GAP  facet F12  effort M
- Legacy: Legacy plain class/broadcast notices shown unread-neutral (no per-user isRead mutation). `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:54-74`
- vNext now: vNext personal unread status with module marker and announcements always read-less. `src/components/activity/notification-list.tsx:138-144`, `src/modules/activity/learner-notification-inbox-model.ts:26-35`
- Fix: Preserve nonpersonal broadcast designation and not falsely count unread.

## G2-18-004-089  [P2] GAP  facet F20  effort S
- Legacy: Legacy `?tab` canonical invalid values reset to all. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:532-558`
- vNext now: vNext unknown `tab` fails strict query parsing and notFound. `src/modules/activity/learner-notification-inbox-model.ts:4-19`, `src/app/(authenticated)/learn/notifications/page.tsx:16-17`
- Fix: Normalize legacy tab values rather than 404.

## G2-18-004-094  [P2] GAP  facet F21  effort M
- Legacy: Legacy job assessment external links via window.open noopener. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:72-83`
- vNext now: vNext internal path validation, https-only announcement CTA. `src/modules/activity/learner-notification-inbox-model.ts:20-25`, `src/components/activity/learner-notifications-inbox.tsx:67-75`
- Fix: Provide explicit secure external assessment launch behavior if required.

## G2-18-004-032  [P3] GAP  facet F06  effort S
- Legacy: Legacy initial page filter `all` with a bell icon. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:620-630`
- vNext now: vNext default category all, className selected FilterChip. `src/modules/activity/learner-notification-inbox-model.ts:4-8`, `src/components/activity/learner-notifications-inbox.tsx:122-137`
- Fix: Match icon and active pill dimensions.
