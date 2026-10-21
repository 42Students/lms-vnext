# Work packet (wave 2): edit src/app/(authenticated)/tpo/notifications/page.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l11-u018-tpo-notifications.md

## G2-11-018-002  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/tpo/notifications.js:108-114 PageShell and ListingPageHeader; right action Mark all as read.
- vNext now: src/app/(authenticated)/tpo/notifications/page.tsx:75-88 PageHeader then separate NotificationToolbar, action below title.
- Fix: Align Mark all as read on right of page header, preserve old title/breadcrumb geometry.

## G2-11-018-003  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/notifications.js:107-123 PageShell → head → (PanelError/Skeleton/feed) then Card and Segmented.
- vNext now: src/app/(authenticated)/tpo/notifications/page.tsx:75-122 header → toolbar → refresh → alert → uncarded feed → pager.
- Fix: Restore white feed Card with segmented filter header and border/padding.

## G2-11-018-005  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/tpo/notifications.js:125-133 segmented options 'Latest N' or 'All (N)', 'Unread (N)'.
- vNext now: src/components/activity/notification-toolbar.tsx:59-81 renders two linked chips with same All/Unread text, src/app/(authenticated)/tpo/notifications/page.tsx:84 passes page-specific N.
- Fix: Use AntD-style segmented group widths/active fill and show accurate latest count across pages.

## G2-11-018-007  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/notifications.js:179-185 action 'Show older' and 'latest 200' cap explanation.
- vNext now: src/app/(authenticated)/tpo/notifications/page.tsx:110-117 action 'Older notifications', unbounded cursor-based pages.
- Fix: Use literal 'Show older' and distinguish window/cursor history; make original page grow rather than replace if pixel parity required.

## G2-11-018-012  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/notifications.js:15-18 starts window50, grows 50 until200, newest-first, olderUnread count.
- vNext now: src/modules/activity/tpo-notifications-service.ts:77-84 listOwnNotificationPage limit50 with beforeCreatedAt/Id, src/app/(authenticated)/tpo/notifications/page.tsx:70-73 cursor replaces page content.
- Fix: Provide append-view 'Show older' or clearly indicate paging behavior and total unread.

## G2-11-018-030  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/notifications.js:116-136 distinct initial load PanelError/ListSkeleton 5 rows, refreshing RefreshStatus, stale Alert.
- vNext now: src/app/(authenticated)/tpo/notifications/page.tsx:58 and :75-89 SSR render; no 5-row feed skeleton or stale warning in page.
- Fix: Add 5-row skeleton and stale-data-aware background refresh UI.

## G2-11-018-031  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/tpo/notifications.js:139-140 filtered-empty text: 'No unread notifications' vs 'Nothing yet'; older unread explanation.
- vNext now: src/app/(authenticated)/tpo/notifications/page.tsx:98-108 and src/components/activity/notification-list.tsx:79-101 preserves both empty strings, but no filtered-window olderUnread alternate when cursor page empty.
- Fix: Keep exact empty/older-unread distinction for limit/window cases.

## G2-11-018-038  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/tpo/notifications.js:183 CTA 'Show older'
- vNext now: src/app/(authenticated)/tpo/notifications/page.tsx:116 CTA 'Older notifications'.
- Fix: Change CTA to Show older.
