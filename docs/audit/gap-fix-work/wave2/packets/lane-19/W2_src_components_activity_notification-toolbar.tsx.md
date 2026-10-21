# Work packet (wave 2): edit src/components/activity/notification-toolbar.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/teacher-notifications.md, docs/audit/gap2/lane-8/l11-u018-tpo-notifications.md, docs/audit/gap2/lane-8/notification.md

## G2-6-008-007  [P2] GAP  facet F03  effort M
- Legacy: Old filter pills All plus College, Department, Faculty, Personal each icon and count `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:519-531` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:619-643`
- vNext now: New links All/Unread plus Mark all as read button `src/components/activity/notification-toolbar.tsx:53-78`
- Fix: Restore 5 icon/count category pills and accessible pressed state

## G2-6-008-011  [P2] GAP  facet F03  effort M
- Legacy: Old row count pills include all categories even zero `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:560-567` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:619-643`
- vNext now: New toolbar unreadCount on one button only `src/app/(authenticated)/teacher/notifications/page.tsx:80-81` `src/components/activity/notification-toolbar.tsx:62-68`
- Fix: Calculate and display category counts for all 5 filters

## G2-6-008-022  [P2] GAP  facet F06  effort M
- Legacy: Old no editable form; category tabs are buttons/URL replace `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:619-643`
- vNext now: New filter navigation is URL links, mark-read buttons `src/components/activity/notification-toolbar.tsx:53-78`
- Fix: Provide original category pill behavior and shallow URL replace without scroll loss

## G2-6-008-052  [P2] GAP  facet F16  effort M
- Legacy: Old five filter pills wrap/squeeze into compact header `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:615-645`
- vNext now: New 2-button filter grid and Mark all full-width on phone `src/components/activity/notification-toolbar.tsx:53-78`
- Fix: Provide scrollable/wrapping 5-filter row with 44px touch targets

## G2-6-008-056  [P2] GAP  facet F18  effort S
- Legacy: Old exact filter copy `All`, `College`, `Department`, `Faculty`, `Personal` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:526-531` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:619-643`
- vNext now: New filter copy `All`, `Unread (n)` `src/components/activity/notification-toolbar.tsx:55-68`
- Fix: Match original category wording and icon names

## G2-6-008-063  [P2] GAP  facet F20  effort M
- Legacy: Old category URL shallow router.replace without scroll `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:544-558`
- vNext now: New links rerender server and may reset scroll `src/components/activity/notification-toolbar.tsx:55-65`
- Fix: Retain list scroll and focus when switching category filters

## G2-11-018-005  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/tpo/notifications.js:125-133 segmented options 'Latest N' or 'All (N)', 'Unread (N)'.
- vNext now: src/components/activity/notification-toolbar.tsx:59-81 renders two linked chips with same All/Unread text, src/app/(authenticated)/tpo/notifications/page.tsx:84 passes page-specific N.
- Fix: Use AntD-style segmented group widths/active fill and show accurate latest count across pages.

## G2-11-018-035  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/notifications.js:143-174 AntD List in single column, cards and segmented controls; responsive old CSS uses .tpo-notifications.
- vNext now: src/components/activity/notification-list.tsx:110-143 full width row buttons with 44px min touch target, src/components/activity/notification-toolbar.tsx:59-81 stacks on phone.
- Fix: Match 375/768/1280 screenshot row height, card width and all/unread segmented appearance.

## G2-8-018-007  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:620-641: All and role-category count pills
- vNext now: src/components/activity/notification-toolbar.tsx:55-68: All and Unread(n)
- Fix: Compute and display count for each original category.

## G2-8-018-059  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:289-322,714-745: responsive card and modal max-width calc(100vw-32px)
- vNext now: src/components/activity/notification-list.tsx:105-198, src/components/activity/notification-toolbar.tsx:53-78: responsive row and filter controls
- Fix: Check 375/768/1280 widths for modal sizing, filter wrap and touch card.

## G2-8-018-060  [P2] GAP  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:295-301,621-635: row aria-label and category aria-pressed
- vNext now: src/components/activity/notification-list.tsx:110-117,150-151, src/components/activity/notification-toolbar.tsx:53-69: aria-label and aria-current links
- Fix: Preserve category pressed-state semantics and row context in accessible names.

## G2-8-018-063  [P2] GAP  facet F18  effort M
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:36-48,620-641: “Course”, “Project”, “Announcements”, “Job”
- vNext now: src/components/activity/notification-toolbar.tsx:55-68: “All”, “Unread”
- Fix: Restore role-category words, counts and title casing.
