# Work packet: edit src/components/activity/learner-notifications-inbox.tsx

16 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u004-learner-notifications.md

## G2-18-004-014  [P1] GAP  facet F03  effort M
- Legacy: Legacy detail modal CTA `Take Assessment`, `Interview Schedule`, `View Application`, `View Course` based on type. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:65-110`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:712-735`
- vNext now: vNext actionable href only accepted if safe same-app learner route, additional external announcement link. `src/modules/activity/learner-notification-inbox-model.ts:20-25`, `src/components/activity/learner-notifications-inbox.tsx:232-252`
- Fix: Map legacy job/interview/course/assessment targets to safe new route and explicit external consent.

## G2-18-004-024  [P1] GAP  facet F05  effort M
- Legacy: Legacy category counts based on complete fetched data (class notices up to 2000) not viewport. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:379-391`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:560-567`
- vNext now: vNext loads 60 personal notices plus announcement set, shows `Showing X of Y loaded` and history link. `src/app/(authenticated)/learn/notifications/page.tsx:23-27`, `src/components/activity/learner-notifications-inbox.tsx:174-178`
- Fix: Use full counts via SQL or label preview count accurately, offer unlimited cursor history.

## G2-18-004-027  [P1] GAP  facet F05  effort L
- Legacy: Legacy source notices are class and college announcements fetched separately, merged. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:379-409`
- vNext now: vNext source personal membership notifications and visible announcements, merged. `src/app/(authenticated)/learn/notifications/page.tsx:25-39`, `src/components/activity/learner-notifications-inbox.tsx:57-83`
- Fix: Audit class broadcast delivery parity: ensure class/course notices are fanned out to learner user IDs.

## G2-18-004-034  [P1] GAP  facet F07  effort M
- Legacy: Legacy class notifications failing alone says `Couldn't load class notifications`; other notices remain. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:403-408`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:646-656`
- vNext now: vNext announcement failure notice only; class broadcast source not independently surfaced. `src/app/(authenticated)/learn/notifications/page.tsx:23-36`, `src/components/activity/learner-notifications-inbox.tsx:180-186`
- Fix: If class notices separate, preserve partial failure warning with Retry.

## G2-18-004-045  [P1] GAP  facet F09  effort M
- Legacy: Legacy detail footer context CTA uses window.open noopener noreferrer for external assessment. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:72-83`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:715-734`
- vNext now: vNext only external CTA when announcement has https public button and personal route safe. `src/components/activity/learner-notifications-inbox.tsx:67-75`, `src/components/activity/learner-notifications-inbox.tsx:246-252`
- Fix: Offer safe approved assessment link with noreferrer and explicit external origin display.

## G2-18-004-047  [P1] GAP  facet F10  effort M
- Legacy: Legacy GET classId class notifications paged 200 x up to10, max2000. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:379-391`
- vNext now: vNext `listOwnNotifications(limit:60)` and `/history` separately. `src/app/(authenticated)/learn/notifications/page.tsx:23-27`, `src/components/activity/learner-notifications-inbox.tsx:175-178`
- Fix: Add paginated history with accurate counts and preserve up to2000 listing equivalence where needed.

## G2-18-004-050  [P1] GAP  facet F10  effort M
- Legacy: Legacy static notification detail has deep links by applicationId, jobId, courseId, assessmentUrl, interviewId. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:65-110`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/NotificationService.java:91-121`
- vNext now: vNext actionHref delivered as internal path, safe filtered and optionally converted placements. `src/modules/activity/notification-service.ts:34-58`, `src/components/activity/learner-notifications-inbox.tsx:209-214`
- Fix: Define full old→new link map, validate ownership of each target, keep compatible action labels.

## G2-18-004-059  [P1] GAP  facet F12  effort L
- Legacy: Legacy job/application/interview deep link based on numeric IDs. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:83-110`
- vNext now: vNext UUID routes require validated actionHref generated by source event. `src/modules/activity/notification-service.ts:34-58`, `src/components/activity/learner-notifications-inbox.tsx:209-214`
- Fix: Provide secure resolved mapping at producer time; explicit unknown-target fallback.

## G2-18-004-071  [P1] GAP  facet F15  effort M
- Legacy: Legacy broadcast is SSE-pushed after create and updated/deleted notification changes. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:145-163`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:218-249`
- vNext now: vNext inbox server snapshot no explicit live subscription in mapped component. `src/app/(authenticated)/learn/notifications/page.tsx:23-39`, `src/components/activity/learner-notifications-inbox.tsx:43-55`
- Fix: Add scoped polling or push refresh compatible with SSE arrival expectations.

## G2-18-004-084  [P1] GAP  facet F19  effort M
- Legacy: Legacy class notice fetch loops at most 10 pages x200, can be ~2,000 rows. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:379-391`
- vNext now: vNext 60 personal notifications initial and 100? history via separate route. `src/app/(authenticated)/learn/notifications/page.tsx:23-27`, `src/components/activity/learner-notifications-inbox.tsx:175-178`
- Fix: Show cap and total count; cursor-paginate or virtualize long inbox.

## G2-18-004-033  [P2] GAP  facet F07  effort M
- Legacy: Legacy both class notifications and announcements failing yields `Couldn't load notifications` with Retry. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:393-405`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:593-606`
- vNext now: vNext personal DB query failure throws during SSR; announcements failure degrades partial. `src/app/(authenticated)/learn/notifications/page.tsx:23-36`, `src/components/activity/learner-notifications-inbox.tsx:180-186`
- Fix: Provide route-level exact error panel and Retry personal without false empty inbox.

## G2-18-004-036  [P2] GAP  facet F07  effort M
- Legacy: Legacy recent refresh failure keeps last loaded list and says `Couldn't refresh notifications`. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:661-671`
- vNext now: vNext server refresh replaces inbox on successful route fetch; no equivalent client stale-data buffer. `src/app/(authenticated)/learn/notifications/page.tsx:23-61`, `src/components/activity/learner-notifications-inbox.tsx:180-186`
- Fix: Cache scoped previous data or show fetch error without claiming empty state.

## G2-18-004-038  [P2] GAP  facet F08  effort S
- Legacy: Legacy retry for full error is inline PanelError button. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:593-607`
- vNext now: vNext announces only retry for partial announcements; personal backend fail is server error boundary. `src/app/(authenticated)/learn/notifications/page.tsx:23-36`, `src/components/activity/learner-notifications-inbox.tsx:180-186`
- Fix: Add inline Retry all/current personal and keep route context.

## G2-18-004-040  [P2] GAP  facet F08  effort S
- Legacy: Legacy loading refresh label `Refreshing notifications…`. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:661-663`
- vNext now: vNext list and filters are server-snapshot refreshed, no explicit refresh indicator. `src/components/activity/learner-notifications-inbox.tsx:120-180`
- Fix: Add pending RefreshStatus preserving list when refetching.

## G2-18-004-035  [P3] GAP  facet F07  effort S
- Legacy: Legacy announcement partial error `Couldn't load college announcements` and Retry. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:403-408`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:646-656`
- vNext now: vNext `Announcements not refreshed` plus Retry announcements. `src/components/activity/learner-notifications-inbox.tsx:180-186`
- Fix: Use legacy message, note personal inbox remains available.

## G2-18-004-039  [P3] GAP  facet F08  effort S
- Legacy: Legacy full load failure copy `Notifications could not be loaded. Retry without leaving this page.` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:599-605`
- vNext now: vNext no matching exact copy in learner inbox. `src/components/activity/learner-notifications-inbox.tsx:180-195`
- Fix: Restore exact copy in error state.
