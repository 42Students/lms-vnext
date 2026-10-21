# Work packet (wave 2): edit src/modules/activity/faculty-notifications-access.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/teacher-notifications.md

## G2-6-008-002  [P2] GAP  facet F01  effort M
- Legacy: Old redirects wrong-role accounts to learner notifications or college-admin dashboard using login role `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:359-377`
- vNext now: New requireFacultyNotificationsAccess throws AuthorizationError, parent layout redirects unauthorized to dashboard `src/app/(authenticated)/teacher/notifications/page.tsx:32-34` `src/modules/activity/faculty-notifications-access.ts:14-24`
- Fix: Map wrong-role redirect targets while preserving server authorization
