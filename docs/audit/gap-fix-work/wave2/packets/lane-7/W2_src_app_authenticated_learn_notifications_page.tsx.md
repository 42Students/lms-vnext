# Work packet (wave 2): edit src/app/(authenticated)/learn/notifications/page.tsx

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l12-u013-notification-search.md, docs/audit/gap2/lane-11/l17-u026-notification-controller.md, docs/audit/gap2/lane-18/u004-learner-notifications.md

## G2-12-013-011  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/notifications/NotificationSearchCache.java:35-39: title+message full-text search cached.
- vNext now: src/app/(authenticated)/learn/notifications/page.tsx:64-80: learner inbox offers own q filter.
- Fix: Verify server-side title/body search semantics; no global leak.

## G2-12-013-041  [P2] GAP  facet F22  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/notifications/NotificationSearchCache.java:44-53: NotificationRepository.findAllActive, CourseRepository slug enrichment.
- vNext now: src/app/(authenticated)/learn/notifications/page.tsx:7-27: own inAppNotifications + announcements, no slug enrichment.
- Fix: Preserve course deep links via actionHref resolution.

## G2-17-026-031  [P2] GAP  facet F13  effort M
- Legacy: Legacy client preserves last-good list on refresh failure and stops after 5 SSE errors; useNotificationFeed.js:50-66,110-125
- vNext now: Server render requires notification query success to show page; learn/notifications/page.tsx:30-44
- Fix: Introduce retry/error fallback without clearing last-known data when a background refresh fails.

## G2-18-004-002  [P2] GAP  facet F01  effort S
- Legacy: Legacy shared component detects learner/faculty/mentor roles and redirects wrong-role requests. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:327-375`
- vNext now: vNext learner page uses persisted LEARNER membership and authorization, not generic role-redirect. `src/app/(authenticated)/learn/notifications/page.tsx:18-20`, `src/modules/activity/learner-notification-membership-service.ts:12-40`
- Fix: Decide wrong-role redirect destination vs explicit 403/404 and show equivalent navigation.

## G2-18-004-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy PageShell wraps ListingPageHeader metrics pills then gray floating notification list. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:612-660`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:615-644`
- vNext now: vNext standalone PageHeader description, separate FilterChip toolbar/search, bordered list. `src/app/(authenticated)/learn/notifications/page.tsx:61-81`, `src/components/activity/learner-notifications-inbox.tsx:120-164`, `src/components/activity/notification-list.tsx:105-111`
- Fix: Match header/pills spacing and floating-list canvas, place enhancements in secondary toolbar.

## G2-18-004-008  [P2] GAP  facet F02  effort M
- Legacy: Legacy list uses 5 skeleton rows before first fetch. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:683-690`
- vNext now: vNext first paint awaits server DB then renders data; no same 5-card skeleton in inbox. `src/app/(authenticated)/learn/notifications/page.tsx:23-61`, `src/components/activity/learner-notifications-inbox.tsx:195-214`
- Fix: Add matched route loading.tsx five-card skeleton, test streaming fallback.

## G2-18-004-063  [P2] GAP  facet F13  effort M
- Legacy: Legacy partial failure warns while rendering loaded source. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:645-682`
- vNext now: vNext partial announcement warning but a personal source failure SSR error. `src/app/(authenticated)/learn/notifications/page.tsx:23-36`, `src/components/activity/learner-notifications-inbox.tsx:180-186`
- Fix: Render partial with independent source-state counters and Retry.

## G2-18-004-068  [P2] GAP  facet F14  effort M
- Legacy: Legacy old notices up to 2000 in list before frontend filters; no history pagination button. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:379-391`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:612-711`
- vNext now: vNext list 60 and `/learn/notifications/history` separately. `src/app/(authenticated)/learn/notifications/page.tsx:23-27`, `src/components/activity/learner-notifications-inbox.tsx:175-178`
- Fix: Explain 60-preview cap and offer cursor history with total count.

## G2-18-004-087  [P2] GAP  facet F19  effort M
- Legacy: Legacy retry keeps old list while background refresh in progress. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:496-505`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:661-672`
- vNext now: vNext router.refresh and server reassessment can replace content. `src/components/activity/learner-notifications-inbox.tsx:180-186`, `src/app/(authenticated)/learn/notifications/page.tsx:23-39`
- Fix: Preserve last authorized list and show RefreshStatus until new snapshot arrives.

## G2-18-004-089  [P2] GAP  facet F20  effort S
- Legacy: Legacy `?tab` canonical invalid values reset to all. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:532-558`
- vNext now: vNext unknown `tab` fails strict query parsing and notFound. `src/modules/activity/learner-notification-inbox-model.ts:4-19`, `src/app/(authenticated)/learn/notifications/page.tsx:16-17`
- Fix: Normalize legacy tab values rather than 404.

## G2-18-004-097  [P2] GAP  facet F22  effort M
- Legacy: Legacy created_at JDBC serialized sometimes as `[year,month0,day]` array. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:242-254`
- vNext now: vNext DB timestamptz to ISO; Intl IST frontend. `src/app/(authenticated)/learn/notifications/page.tsx:50-56`, `src/components/activity/notification-list.tsx:31-39`
- Fix: Normalize source dates including zero-indexed month without timezone drift.

## G2-18-004-006  [P3] GAP  facet F02  effort S
- Legacy: Legacy PageShell has no top descriptive subtitle; header occupies one row. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:615-644`
- vNext now: vNext header description `Your personal updates and college announcements.` `src/app/(authenticated)/learn/notifications/page.tsx:61-64`
- Fix: Remove/relocate subtitle for pixel parity.

## G2-18-004-076  [P3] GAP  facet F17  effort S
- Legacy: Legacy PageShell header aria `Notifications overview`. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:615-619`
- vNext now: vNext PageHeader `Notifications` no explicit overview ariaLabel prop. `src/app/(authenticated)/learn/notifications/page.tsx:61-64`
- Fix: Expose equivalent accessible header name.

## G2-18-004-079  [P3] GAP  facet F18  effort S
- Legacy: Legacy notifications title exact `Notifications`, no subtitle. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:615-620`
- vNext now: vNext same heading plus description. `src/app/(authenticated)/learn/notifications/page.tsx:61-64`
- Fix: Hide secondary subtitle for literal view.
