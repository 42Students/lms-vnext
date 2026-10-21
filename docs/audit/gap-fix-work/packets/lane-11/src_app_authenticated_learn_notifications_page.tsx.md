# Work packet: edit src/app/(authenticated)/learn/notifications/page.tsx

18 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l17-u026-notification-controller.md, docs/audit/gap2/lane-18/u004-learner-notifications.md, docs/audit/gap2/lane-2/l17-u026-notification-controller.md

## G2-17-026-002  [P1] GAP  facet F01  effort M
- Legacy: Learner hook establishes classId-scoped bell feed, SSE reconnect; useNotificationFeed.js:29-39,76-125
- vNext now: Learner inbox loads by active membership + collegeId; learn/notifications/page.tsx:21-40
- Fix: Specify class/course versus membership eligibility conversion and deep-link redirects on parity matrix.

## G2-17-026-009  [P1] GAP  facet F05  effort M
- Legacy: Class feed page/size optional and default 100/max500; NotificationController.java:142-155; NotificationServiceImpl.java:274-287
- vNext now: Learner own feed limit60 and no server next-cursor in page; learn/notifications/page.tsx:32-35
- Fix: Provide full history pagination rather than truncating class notifications after 60.

## G2-17-026-040  [P1] GAP  facet F19  effort M
- Legacy: Legacy class feed default100/max500, batched course slug enrichment; NotificationServiceImpl.java:273-327
- vNext now: Learner page limits60 and no deep-load route; learn/notifications/page.tsx:32-35
- Fix: Add paged learner history; avoid naive full-table filter of large notifications.

## G2-18-004-003  [P1] GAP  facet F01  effort S
- Legacy: Legacy deep link query uses `?tab=course\\|project\\|general\\|job`. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:532-558`
- vNext now: vNext expects `?category=course\\|project\\|general\\|job`, rejects unknown query keys with notFound. `src/app/(authenticated)/learn/notifications/page.tsx:13-17`, `src/modules/activity/learner-notification-inbox-model.ts:4-19`
- Fix: Translate old tab query to validated category in authorized compatibility redirect.

## G2-18-004-024  [P1] GAP  facet F05  effort M
- Legacy: Legacy category counts based on complete fetched data (class notices up to 2000) not viewport. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:379-391`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:560-567`
- vNext now: vNext loads 60 personal notices plus announcement set, shows `Showing X of Y loaded` and history link. `src/app/(authenticated)/learn/notifications/page.tsx:23-27`, `src/components/activity/learner-notifications-inbox.tsx:174-178`
- Fix: Use full counts via SQL or label preview count accurately, offer unlimited cursor history.

## G2-18-004-025  [P1] GAP  facet F05  effort S
- Legacy: Legacy filter persists as `?tab` across refresh. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:532-559`
- vNext now: vNext `?category` parser treats `tab` unknown and 404s. `src/app/(authenticated)/learn/notifications/page.tsx:13-17`, `src/modules/activity/learner-notification-inbox-model.ts:4-19`
- Fix: Support tab alias and normalized redirect.

## G2-18-004-027  [P1] GAP  facet F05  effort L
- Legacy: Legacy source notices are class and college announcements fetched separately, merged. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:379-409`
- vNext now: vNext source personal membership notifications and visible announcements, merged. `src/app/(authenticated)/learn/notifications/page.tsx:25-39`, `src/components/activity/learner-notifications-inbox.tsx:57-83`
- Fix: Audit class broadcast delivery parity: ensure class/course notices are fanned out to learner user IDs.

## G2-18-004-034  [P1] GAP  facet F07  effort M
- Legacy: Legacy class notifications failing alone says `Couldn't load class notifications`; other notices remain. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:403-408`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:646-656`
- vNext now: vNext announcement failure notice only; class broadcast source not independently surfaced. `src/app/(authenticated)/learn/notifications/page.tsx:23-36`, `src/components/activity/learner-notifications-inbox.tsx:180-186`
- Fix: If class notices separate, preserve partial failure warning with Retry.

## G2-18-004-047  [P1] GAP  facet F10  effort M
- Legacy: Legacy GET classId class notifications paged 200 x up to10, max2000. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:379-391`
- vNext now: vNext `listOwnNotifications(limit:60)` and `/history` separately. `src/app/(authenticated)/learn/notifications/page.tsx:23-27`, `src/components/activity/learner-notifications-inbox.tsx:175-178`
- Fix: Add paginated history with accurate counts and preserve up to2000 listing equivalence where needed.

## G2-18-004-071  [P1] GAP  facet F15  effort M
- Legacy: Legacy broadcast is SSE-pushed after create and updated/deleted notification changes. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:145-163`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:218-249`
- vNext now: vNext inbox server snapshot no explicit live subscription in mapped component. `src/app/(authenticated)/learn/notifications/page.tsx:23-39`, `src/components/activity/learner-notifications-inbox.tsx:43-55`
- Fix: Add scoped polling or push refresh compatible with SSE arrival expectations.

## G2-18-004-084  [P1] GAP  facet F19  effort M
- Legacy: Legacy class notice fetch loops at most 10 pages x200, can be ~2,000 rows. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:379-391`
- vNext now: vNext 60 personal notifications initial and 100? history via separate route. `src/app/(authenticated)/learn/notifications/page.tsx:23-27`, `src/components/activity/learner-notifications-inbox.tsx:175-178`
- Fix: Show cap and total count; cursor-paginate or virtualize long inbox.

## G2-18-004-093  [P1] GAP  facet F21  effort L
- Legacy: Legacy notifications come from class notification REST and college announcements REST; SSE class updates. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:22-24`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:379-409`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:145-163`
- vNext now: vNext Drizzle in_app_notifications+activity_event and announcement tables; no SSE in mapped page. `src/app/(authenticated)/learn/notifications/page.tsx:5-8`, `src/modules/activity/notification-service.ts:273-337`
- Fix: Inventory old source producers, fanout, release/schedule and expose compatible refresh.

## G2-18-004-095  [P1] GAP  facet F21  effort M
- Legacy: Legacy page uses notificationService and announcement API; no email templates rendered here. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:22-24`
- vNext now: vNext announcementRuntimeEnabled may disable announcements entirely during rollout. `src/app/(authenticated)/learn/notifications/page.tsx:21-36`
- Fix: Enable announcement feature when migration complete; show accurate source unavailable warning.

## G2-17-026-056  [P1] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:175-192 superadmin pageable max200; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:271-305 class/recipient first100 max500
- vNext now: src/modules/activity/notification-service.ts:282-338 own GET max100 and src/app/(authenticated)/learn/notifications/page.tsx:25-27 hard 60 limit
- Fix: Give each role cursor or offset pagination with reliable unbounded history

## G2-18-004-033  [P2] GAP  facet F07  effort M
- Legacy: Legacy both class notifications and announcements failing yields `Couldn't load notifications` with Retry. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:393-405`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:593-606`
- vNext now: vNext personal DB query failure throws during SSR; announcements failure degrades partial. `src/app/(authenticated)/learn/notifications/page.tsx:23-36`, `src/components/activity/learner-notifications-inbox.tsx:180-186`
- Fix: Provide route-level exact error panel and Retry personal without false empty inbox.

## G2-18-004-036  [P2] GAP  facet F07  effort M
- Legacy: Legacy recent refresh failure keeps last loaded list and says `Couldn't refresh notifications`. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:661-671`
- vNext now: vNext server refresh replaces inbox on successful route fetch; no equivalent client stale-data buffer. `src/app/(authenticated)/learn/notifications/page.tsx:23-61`, `src/components/activity/learner-notifications-inbox.tsx:180-186`
- Fix: Cache scoped previous data or show fetch error without claiming empty state.

## G2-18-004-037  [P2] GAP  facet F07  effort M
- Legacy: Legacy no classID -> no class notifications but still loads announcements. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:349-354`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:393-409`
- vNext now: vNext persisted learner membership mandatory; no classId required for personal rows. `src/modules/activity/learner-notification-membership-service.ts:12-40`, `src/app/(authenticated)/learn/notifications/page.tsx:20-27`
- Fix: Ensure course/batch notices appear for learners without current class, and empty class history is explained.

## G2-18-004-038  [P2] GAP  facet F08  effort S
- Legacy: Legacy retry for full error is inline PanelError button. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:593-607`
- vNext now: vNext announces only retry for partial announcements; personal backend fail is server error boundary. `src/app/(authenticated)/learn/notifications/page.tsx:23-36`, `src/components/activity/learner-notifications-inbox.tsx:180-186`
- Fix: Add inline Retry all/current personal and keep route context.
