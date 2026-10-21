# Work packet (wave 2): edit src/modules/courses/faculty-notification-link-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/teacher-notifications.md

## G2-6-008-064  [P2] GAP  facet F21  effort M
- Legacy: Old getCourseName called per unknown courseId with Promise.all fallback `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:156-201`
- vNext now: New faculty actionHref sanitized; no explicit course-name enrich stage `src/modules/courses/faculty-notification-link-model.ts:3-18` `src/app/(authenticated)/teacher/notifications/page.tsx:60-69`
- Fix: Populate course context from activity event or scoped lookup for legacy notifications
