# Work packet (wave 2): edit src/app/(authenticated)/teacher/notifications/page.tsx

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/teacher-notifications.md

## G2-6-008-002  [P2] GAP  facet F01  effort M
- Legacy: Old redirects wrong-role accounts to learner notifications or college-admin dashboard using login role `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:359-377`
- vNext now: New requireFacultyNotificationsAccess throws AuthorizationError, parent layout redirects unauthorized to dashboard `src/app/(authenticated)/teacher/notifications/page.tsx:32-34` `src/modules/activity/faculty-notifications-access.ts:14-24`
- Fix: Map wrong-role redirect targets while preserving server authorization

## G2-6-008-004  [P2] GAP  facet F02  effort L
- Legacy: Old one PageShell contains ListingPageHeader/filters and interleaved notification list `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:612-646` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:658-712`
- vNext now: New PageHeader, Personal notifications heading/toolbar/list, College announcements separate section after `src/app/(authenticated)/teacher/notifications/page.tsx:71-120`
- Fix: Recreate same unified feed section order and chrome

## G2-6-008-011  [P2] GAP  facet F03  effort M
- Legacy: Old row count pills include all categories even zero `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:560-567` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:619-643`
- vNext now: New toolbar unreadCount on one button only `src/app/(authenticated)/teacher/notifications/page.tsx:80-81` `src/components/activity/notification-toolbar.tsx:62-68`
- Fix: Calculate and display category counts for all 5 filters

## G2-6-008-012  [P2] GAP  facet F04  effort M
- Legacy: Old item title defaults to `Notification`; context derived from courseName/receiverType with dash fallback `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:113-132` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:308-320`
- vNext now: New uses notification.title and only event.module with readAt/date `src/app/(authenticated)/teacher/notifications/page.tsx:60-69` `src/components/activity/notification-list.tsx:139-163`
- Fix: Restore context_label/course/receiver fallback metadata per notification row

## G2-6-008-013  [P2] GAP  facet F04  effort M
- Legacy: Old date uses shared formatNotificationDate on created_at, supports legacy `[year,month,day]` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:242-253` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:318-319`
- vNext now: New personal createdAt ISO and client formatWhen `src/app/(authenticated)/teacher/notifications/page.tsx:60-69` `src/components/activity/notification-list.tsx:127-127`
- Fix: Normalize legacy Java date arrays and match IST presentation

## G2-6-008-015  [P2] GAP  facet F04  effort M
- Legacy: Old merged announcement titles and contexts tagged `lms_announcement` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:205-225`
- vNext now: New announcement item contains senderType/receiverType/pinned/title/message/createdAt `src/app/(authenticated)/teacher/notifications/page.tsx:108-119` `src/components/announcements/announcement-feed.tsx:85-115`
- Fix: Map announcements into same card schema with receiver context and source identity

## G2-6-008-042  [P2] GAP  facet F12  effort M
- Legacy: Old optional missing context fallback '—' and class/course lookup fallback `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:113-132` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:156-203`
- vNext now: New event module and announcement receiverType available, not old context fallback `src/app/(authenticated)/teacher/notifications/page.tsx:60-69` `src/app/(authenticated)/teacher/notifications/page.tsx:114-116`
- Fix: Map context label, course name and dash fallback

## G2-6-008-044  [P2] GAP  facet F13  effort M
- Legacy: Old empty all `No notifications yet` with illustrated check icon and descriptive faculty text `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:255-270` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:577-589`
- vNext now: New personal EmptyText `Nothing yet.` and announcements empty `No active announcements for you right now.` `src/app/(authenticated)/teacher/notifications/page.tsx:92-96` `src/components/announcements/announcement-feed.tsx:79-82`
- Fix: Render exact rich empty illustration/title/description on unified all feed

## G2-6-008-045  [P2] GAP  facet F13  effort S
- Legacy: Old empty category `No X notifications yet` with View all CTA `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:693-701`
- vNext now: New unread empty `No unread notifications.` with no category CTA `src/app/(authenticated)/teacher/notifications/page.tsx:92-96`
- Fix: Add scope-specific empty panels and View all action

## G2-6-008-046  [P2] GAP  facet F13  effort M
- Legacy: Old initial load renders 5 NotificationListSkeleton rows `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:683-690`
- vNext now: New server page renders already loaded result, no local skeleton block `src/app/(authenticated)/teacher/notifications/page.tsx:37-71`
- Fix: Provide 5-row route pending skeleton

## G2-6-008-057  [P2] GAP  facet F18  effort S
- Legacy: Old empty faculty copy `Announcements across college, department, and faculty will appear here.` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:582-587`
- vNext now: New personal empty `Nothing yet.` and announcement empty `No active announcements...` `src/app/(authenticated)/teacher/notifications/page.tsx:92-96` `src/components/announcements/announcement-feed.tsx:79-82`
- Fix: Restore exact legacy empty body copy for all-feed state

## G2-6-008-058  [P2] GAP  facet F18  effort S
- Legacy: Old error `Couldn't load notifications` and `Notifications could not be loaded. Retry without leaving this page.` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:593-605`
- vNext now: New invalid filters copy differs and route throws loading failures `src/app/(authenticated)/teacher/notifications/page.tsx:82-89` `src/app/(authenticated)/teacher/notifications/page.tsx:37-50`
- Fix: Restore legacy full error text and Retry

## G2-6-008-062  [P2] GAP  facet F20  effort M
- Legacy: Old date parser arrays [year,month,day] uses local Date (month0) `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:242-253`
- vNext now: New ISO timestamps and announcement Intl Asia/Kolkata `src/app/(authenticated)/teacher/notifications/page.tsx:60-69` `src/components/announcements/announcement-feed.tsx:104-113`
- Fix: Define IST normalization for imported legacy arrays and same date display

## G2-6-008-064  [P2] GAP  facet F21  effort M
- Legacy: Old getCourseName called per unknown courseId with Promise.all fallback `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:156-201`
- vNext now: New faculty actionHref sanitized; no explicit course-name enrich stage `src/modules/courses/faculty-notification-link-model.ts:3-18` `src/app/(authenticated)/teacher/notifications/page.tsx:60-69`
- Fix: Populate course context from activity event or scoped lookup for legacy notifications
