# Work packet (wave 2): edit src/modules/activity/learner-notification-category.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u004-learner-notifications.md

## G2-18-004-057  [P2] GAP  facet F12  effort M
- Legacy: Legacy announcements categories by notification_type JOB/COURSE or course ID, with fallback announcement. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:135-144`
- vNext now: vNext categories derived from event.module plus announcement source. `src/modules/activity/learner-notification-category.ts:1-40`, `src/modules/activity/learner-notification-inbox-model.ts:26-35`
- Fix: Crosswalk legacy notification_type to vNext module strings; test all producer cases.
