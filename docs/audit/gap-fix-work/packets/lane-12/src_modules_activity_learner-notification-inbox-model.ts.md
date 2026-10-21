# Work packet: edit src/modules/activity/learner-notification-inbox-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l17-u026-notification-controller.md, docs/audit/gap2/lane-18/u004-learner-notifications.md

## G2-17-026-010  [P1] GAP  facet F05  effort M
- Legacy: Class/course filter: classId plus `courseSlug` precedence over `courseId`; NotificationController.java:125-139
- vNext now: Recipient-centered inbox filters category/unread/q; learner-notification-inbox-model.ts:4-17
- Fix: Add course-scoped navigation/filter if required by old course inbox; retain URL validation.

## G2-18-004-003  [P1] GAP  facet F01  effort S
- Legacy: Legacy deep link query uses `?tab=course\\|project\\|general\\|job`. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:532-558`
- vNext now: vNext expects `?category=course\\|project\\|general\\|job`, rejects unknown query keys with notFound. `src/app/(authenticated)/learn/notifications/page.tsx:13-17`, `src/modules/activity/learner-notification-inbox-model.ts:4-19`
- Fix: Translate old tab query to validated category in authorized compatibility redirect.

## G2-18-004-014  [P1] GAP  facet F03  effort M
- Legacy: Legacy detail modal CTA `Take Assessment`, `Interview Schedule`, `View Application`, `View Course` based on type. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:65-110`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:712-735`
- vNext now: vNext actionable href only accepted if safe same-app learner route, additional external announcement link. `src/modules/activity/learner-notification-inbox-model.ts:20-25`, `src/components/activity/learner-notifications-inbox.tsx:232-252`
- Fix: Map legacy job/interview/course/assessment targets to safe new route and explicit external consent.

## G2-18-004-025  [P1] GAP  facet F05  effort S
- Legacy: Legacy filter persists as `?tab` across refresh. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:532-559`
- vNext now: vNext `?category` parser treats `tab` unknown and 404s. `src/app/(authenticated)/learn/notifications/page.tsx:13-17`, `src/modules/activity/learner-notification-inbox-model.ts:4-19`
- Fix: Support tab alias and normalized redirect.
