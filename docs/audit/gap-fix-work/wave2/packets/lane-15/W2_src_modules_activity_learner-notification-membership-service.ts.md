# Work packet (wave 2): edit src/modules/activity/learner-notification-membership-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u004-learner-notifications.md

## G2-18-004-002  [P2] GAP  facet F01  effort S
- Legacy: Legacy shared component detects learner/faculty/mentor roles and redirects wrong-role requests. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:327-375`
- vNext now: vNext learner page uses persisted LEARNER membership and authorization, not generic role-redirect. `src/app/(authenticated)/learn/notifications/page.tsx:18-20`, `src/modules/activity/learner-notification-membership-service.ts:12-40`
- Fix: Decide wrong-role redirect destination vs explicit 403/404 and show equivalent navigation.

## G2-18-004-054  [P2] GAP  facet F11  effort M
- Legacy: Legacy learner class scope resolves classId from shared hook. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:349-354`
- vNext now: vNext member scope collegeId then personal userId for notifications. `src/modules/activity/learner-notification-membership-service.ts:20-39`, `src/modules/activity/notification-service.ts:273-337`
- Fix: Verify class-/section-targeted notices actually reach learner membership.
