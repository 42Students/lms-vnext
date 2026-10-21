# Work packet: edit src/modules/activity/faculty-notifications-access.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/teacher-notifications.md

## G2-6-008-038  [P1] GAP  facet F11  effort M
- Legacy: Old faculty/learner recognized by isFacultyRole/isLearnerRole; redirects mismatched routes `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:349-377`
- vNext now: New `requireFacultyNotificationsAccess` requires active membership FACULTY and academics.read `src/modules/activity/faculty-notifications-access.ts:14-24`
- Fix: Document visibility changes for mentor/admin faculty type and maintain correct role redirect
