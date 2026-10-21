# Work packet (wave 3): edit src/components/activity/notification-list.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/teacher-notifications.md

## G2-6-008-031  [P1] MISSING  facet F09  effort L
- Legacy: Old clicking any list row opens Notification detail modal width520 `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:288-323` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:714-759`
- vNext now: New clickable list item acts as mark-read/navigate in same action; no detail modal `src/components/activity/notification-list.tsx:61-86` `src/components/activity/notification-list.tsx:114-131`
- Fix: Restore 520px detail modal with full rich-text body and metadata
