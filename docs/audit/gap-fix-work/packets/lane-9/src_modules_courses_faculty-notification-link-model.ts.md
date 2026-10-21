# Work packet: edit src/modules/courses/faculty-notification-link-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/teacher-notifications.md

## G2-6-008-032  [P1] GAP  facet F09  effort L
- Legacy: Old detail footer has conditional View Course/View Interview/Take Assessment and `Got it` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:714-746` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:65-110`
- vNext now: New actionHref generic bounded internal teacher URL, no external assessment action `src/modules/courses/faculty-notification-link-model.ts:3-18` `src/components/activity/notification-list.tsx:165-185`
- Fix: Offer only validated faculty-safe conditional deep links; retain Got it and modal close

## G2-6-008-040  [P1] GAP  facet F11  effort M
- Legacy: Old notifications modal course links adapt to role base path `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:99-107`
- vNext now: New facultyNotificationActionHref allows only /teacher or /teach internal paths `src/modules/courses/faculty-notification-link-model.ts:3-18`
- Fix: Audit legacy mentor base path and explicitly support only valid entitled course URLs
