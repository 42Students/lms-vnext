# Work packet: edit src/app/(authenticated)/teacher/notifications/page.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/teacher-notifications.md

## G2-6-008-003  [P1] GAP  facet F01  effort L
- Legacy: Old tabs use `?tab=all
- vNext now: unread` `src/app/(authenticated)/teacher/notifications/page.tsx:35-45` `src/modules/courses/faculty-inbox-query-model.ts:4-8`
- Fix: Restore faculty scope tabs with corresponding counts and preserve deep links

## G2-6-008-006  [P1] GAP  facet F02  effort L
- Legacy: Old page has single source-merged sorted list; 5 category filter pills `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:517-575` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:612-709`
- vNext now: New two parallel lists with personal first, announcements below `src/app/(authenticated)/teacher/notifications/page.tsx:76-119`
- Fix: Merge reads in UI with stable source-tagged sort by created timestamp

## G2-6-008-017  [P1] GAP  facet F05  effort M
- Legacy: Old list sorted all records descending by source independent created timestamp `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:228-253` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:569-575`
- vNext now: New personal notification query cursor ordered createdAt/id, announcement separately pinned-first `src/app/(authenticated)/teacher/notifications/page.tsx:37-57` `src/modules/announcements/service.ts:472-481`
- Fix: Define combined sort precedence and stable source-id deduplication

## G2-6-008-019  [P1] GAP  facet F05  effort M
- Legacy: Old fetches every announcement page 100 at a time until totalRecords `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:412-437`
- vNext now: New announcement read max100, no subsequent paging in page `src/app/(authenticated)/teacher/notifications/page.tsx:47-50` `src/modules/announcements/service.ts:472-481`
- Fix: Expose older-announcements paging or documented cap instead of silently dropping history

## G2-6-008-029  [P1] GAP  facet F08  effort L
- Legacy: Old partial refresh fails with `Couldn't refresh notifications` and preserves prior list `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:664-671`
- vNext now: New Promise.all errors, loses route result during failed refresh `src/app/(authenticated)/teacher/notifications/page.tsx:37-50`
- Fix: Keep last fulfilled client data and show non-destructive partial error

## G2-6-008-041  [P1] GAP  facet F12  effort M
- Legacy: Old faculty category is personal if notification_type exists else receiverType COLLEGE/DEPARTMENT/FACULTY, others excluded `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:144-154`
- vNext now: New personal/announcements separate feed, no corresponding category rules `src/app/(authenticated)/teacher/notifications/page.tsx:76-119`
- Fix: Implement exact category classifier and retain unclassified records in All

## G2-6-008-069  [P1] GAP  facet F23  effort L
- Legacy: Old announcement data interleaved with personal notifications and four scope tabs `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:467-575`
- vNext now: New separate AnnouncementFeed below personal unread filtering `src/app/(authenticated)/teacher/notifications/page.tsx:76-120`
- Fix: Restore merged list and original scope filtering before adding secondary unread UX

## G2-6-008-024  [P2] GAP  facet F07  effort M
- Legacy: Old load failure full-screen `Couldn't load notifications` and exact Retry copy `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:593-609`
- vNext now: New page Promise.all throws to error boundary rather than this in-page PanelError `src/app/(authenticated)/teacher/notifications/page.tsx:37-50`
- Fix: Render legacy error heading/description and inline Retry

## G2-6-008-025  [P2] GAP  facet F07  effort S
- Legacy: Old invalid tab coerces to all and shallow-replaces URL `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:533-558`
- vNext now: New invalid view/cursor emits error banner and Return to newest `src/modules/courses/faculty-inbox-query-model.ts:10-25` `src/app/(authenticated)/teacher/notifications/page.tsx:82-89`
- Fix: Preserve invalid-tab fallback while handling invalid cursors securely

## G2-6-008-027  [P2] GAP  facet F08  effort S
- Legacy: Old full load failed error panel Retry no notification toast `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:593-609`
- vNext now: New no page-specific retry action on page.tsx `src/app/(authenticated)/teacher/notifications/page.tsx:37-50`
- Fix: Match inline Retry language/location, retain boundary for unexpected errors

## G2-6-008-028  [P2] GAP  facet F08  effort M
- Legacy: Old refreshing stale data shows `Refreshing notifications…` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:661-663`
- vNext now: New server read/cursor does not show in-list refresh status `src/app/(authenticated)/teacher/notifications/page.tsx:37-50`
- Fix: Display in-place pending message without clearing last successful feed
