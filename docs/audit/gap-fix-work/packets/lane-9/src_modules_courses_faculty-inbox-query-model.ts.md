# Work packet: edit src/modules/courses/faculty-inbox-query-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/teacher-notifications.md

## G2-6-008-003  [P1] GAP  facet F01  effort L
- Legacy: Old tabs use `?tab=all
- vNext now: unread` `src/app/(authenticated)/teacher/notifications/page.tsx:35-45` `src/modules/courses/faculty-inbox-query-model.ts:4-8`
- Fix: Restore faculty scope tabs with corresponding counts and preserve deep links

## G2-6-008-025  [P2] GAP  facet F07  effort S
- Legacy: Old invalid tab coerces to all and shallow-replaces URL `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:533-558`
- vNext now: New invalid view/cursor emits error banner and Return to newest `src/modules/courses/faculty-inbox-query-model.ts:10-25` `src/app/(authenticated)/teacher/notifications/page.tsx:82-89`
- Fix: Preserve invalid-tab fallback while handling invalid cursors securely
