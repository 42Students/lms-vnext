# Work packet: edit src/components/activity/notification-list.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/teacher-notifications.md, docs/audit/gap2/lane-8/notification.md

## G2-6-008-032  [P1] GAP  facet F09  effort L
- Legacy: Old detail footer has conditional View Course/View Interview/Take Assessment and `Got it` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:714-746` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:65-110`
- vNext now: New actionHref generic bounded internal teacher URL, no external assessment action `src/modules/courses/faculty-notification-link-model.ts:3-18` `src/components/activity/notification-list.tsx:165-185`
- Fix: Offer only validated faculty-safe conditional deep links; retain Got it and modal close

## G2-8-018-033  [P1] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:68-110: Take Assessment / View Interview / View in My Applications / View Course
- vNext now: src/components/activity/notification-list.tsx:166-181: generic href/View
- Fix: Use type-specific button labels/routes and safe assessment external href.

## G2-8-018-034  [P1] GAP  facet F09  effort S
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:714-748: opening detail does not change read state
- vNext now: src/components/activity/notification-list.tsx:61-80,110-117: unread click marks read
- Fix: Separate view from read acknowledgement unless deliberate change approved.
