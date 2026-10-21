# Work packet: edit src/modules/activity/learner-notification-membership-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u004-learner-notifications.md

## G2-18-004-037  [P2] GAP  facet F07  effort M
- Legacy: Legacy no classID -> no class notifications but still loads announcements. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:349-354`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:393-409`
- vNext now: vNext persisted learner membership mandatory; no classId required for personal rows. `src/modules/activity/learner-notification-membership-service.ts:12-40`, `src/app/(authenticated)/learn/notifications/page.tsx:20-27`
- Fix: Ensure course/batch notices appear for learners without current class, and empty class history is explained.
