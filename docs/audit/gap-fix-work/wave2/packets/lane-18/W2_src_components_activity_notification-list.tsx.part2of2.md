# Work packet (wave 2): edit src/components/activity/notification-list.tsx (part 2 of 2)

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/notification.md, docs/audit/gap2/lane-15/notification-service-impl.md, docs/audit/gap2/lane-18/u004-learner-notifications.md, docs/audit/gap2/lane-7/u026-mentor-notifications.md

## G2-8-018-032  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:714-760: 520px modal, safe HTML, tag/context/date, Close
- vNext now: src/components/activity/notification-list.tsx:105-198: no detail modal
- Fix: Implement modal width 520/max calc viewport-32, focus, buttons and content.

## G2-8-018-059  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:289-322,714-745: responsive card and modal max-width calc(100vw-32px)
- vNext now: src/components/activity/notification-list.tsx:105-198, src/components/activity/notification-toolbar.tsx:53-78: responsive row and filter controls
- Fix: Check 375/768/1280 widths for modal sizing, filter wrap and touch card.

## G2-8-018-060  [P2] GAP  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:295-301,621-635: row aria-label and category aria-pressed
- vNext now: src/components/activity/notification-list.tsx:110-117,150-151, src/components/activity/notification-toolbar.tsx:53-69: aria-label and aria-current links
- Fix: Preserve category pressed-state semantics and row context in accessible names.

## G2-8-018-064  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:713-760: “Close” and type-specific CTA labels
- vNext now: src/components/activity/notification-list.tsx:166-197: “View” / “Mark read”
- Fix: Match old button wording for View Course, Take Assessment etc.

## G2-8-018-072  [P2] GAP  facet F20  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/NotificationResponseDTO.java:72-78: month in date array zero-indexed
- vNext now: src/components/activity/notification-list.tsx:31-40: Intl.DateTimeFormat en-IN parses ISO
- Fix: Test legacy month0, timezone rollovers, blank dates.

## G2-15-011-059  [P3] GAP  facet F18  effort S
- Legacy: Old Get notifications for a recipient across classes name. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:158-174`)
- vNext now: New empty text You are all caught up. + workflow helper. (`src/components/activity/notification-list.tsx:87-103`)
- Fix: Compare old dropdown empty wording to new list; preserve exact copy where shared.

## G2-18-004-010  [P3] GAP  facet F02  effort S
- Legacy: Legacy no category result shows PanelEmpty compact within list. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:693-703`
- vNext now: vNext shows NotificationList empty state and Clear filters. `src/components/activity/learner-notifications-inbox.tsx:195-208`, `src/components/activity/notification-list.tsx:87-102`
- Fix: Match PanelEmpty hierarchy and `View all` CTA for single category.

## G2-18-004-017  [P3] GAP  facet F04  effort S
- Legacy: Legacy row body truncated at 80 characters with `...` suffix. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:289-293`
- vNext now: vNext shows entire notification body inline, not truncated to 80 chars. `src/components/activity/notification-list.tsx:157-164`
- Fix: Truncate preview at 80 and preserve full body in Dialog.

## G2-18-004-075  [P3] GAP  facet F17  effort S
- Legacy: Legacy notifications list rows are semantic button with accessible click name from content. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:289-302`
- vNext now: vNext article title Button aria `View notification: TITLE` plus distinct actions. `src/components/activity/notification-list.tsx:145-155`
- Fix: Check keyboard whole-card activation and predictable tab order.

## G2-18-004-081  [P3] GAP  facet F18  effort S
- Legacy: Legacy empty title `No notifications yet` and course/announcement explanatory subtitle. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:577-589`
- vNext now: vNext empty model with `Workflow notifications and announcements appear...`. `src/components/activity/notification-list.tsx:87-101`
- Fix: Restore exact empty title/subtitle by role.

## G2-7-026-070  [P3] GAP  facet F17  effort S
- Legacy: notifications.js:383-389 empty icon described by Empty component
- vNext now: notification-list.tsx:87-101 text-only empty, mentor page :167-170 plain paragraph
- Fix: Restore accessible success cue without duplicating speech

## G2-8-018-008  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:255-268: illustrated empty notification state
- vNext now: src/components/activity/notification-list.tsx:88-101: text-only empty state
- Fix: Match old SVG illustration, padding and icon style.
