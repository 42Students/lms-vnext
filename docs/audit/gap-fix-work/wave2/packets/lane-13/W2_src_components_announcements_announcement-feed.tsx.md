# Work packet (wave 2): edit src/components/announcements/announcement-feed.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/teacher-notifications.md, docs/audit/gap2/lane-7/u026-mentor-notifications.md

## G2-6-008-015  [P2] GAP  facet F04  effort M
- Legacy: Old merged announcement titles and contexts tagged `lms_announcement` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:205-225`
- vNext now: New announcement item contains senderType/receiverType/pinned/title/message/createdAt `src/app/(authenticated)/teacher/notifications/page.tsx:108-119` `src/components/announcements/announcement-feed.tsx:85-115`
- Fix: Map announcements into same card schema with receiver context and source identity

## G2-6-008-044  [P2] GAP  facet F13  effort M
- Legacy: Old empty all `No notifications yet` with illustrated check icon and descriptive faculty text `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:255-270` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:577-589`
- vNext now: New personal EmptyText `Nothing yet.` and announcements empty `No active announcements for you right now.` `src/app/(authenticated)/teacher/notifications/page.tsx:92-96` `src/components/announcements/announcement-feed.tsx:79-82`
- Fix: Render exact rich empty illustration/title/description on unified all feed

## G2-6-008-057  [P2] GAP  facet F18  effort S
- Legacy: Old empty faculty copy `Announcements across college, department, and faculty will appear here.` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:582-587`
- vNext now: New personal empty `Nothing yet.` and announcement empty `No active announcements...` `src/app/(authenticated)/teacher/notifications/page.tsx:92-96` `src/components/announcements/announcement-feed.tsx:79-82`
- Fix: Restore exact legacy empty body copy for all-feed state

## G2-6-008-062  [P2] GAP  facet F20  effort M
- Legacy: Old date parser arrays [year,month,day] uses local Date (month0) `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:242-253`
- vNext now: New ISO timestamps and announcement Intl Asia/Kolkata `src/app/(authenticated)/teacher/notifications/page.tsx:60-69` `src/components/announcements/announcement-feed.tsx:104-113`
- Fix: Define IST normalization for imported legacy arrays and same date display

## G2-7-026-007  [P2] GAP  facet F02  effort M
- Legacy: notifications.js:391-395 all rows spaced 12px as ln-card
- vNext now: notification-list.tsx:105-134 date sections, hairline rows; announcement-feed.tsx:84-88 separated
- Fix: Align row container, separators and section gaps

## G2-7-026-015  [P2] GAP  facet F04  effort M
- Legacy: notifications.js:164-177 announcements tag normalizes notification_type/receiverType with underscores; title fallback Announcement
- vNext now: announcement-feed.tsx:90-112 badge senderType and title, time
- Fix: Use legacy source type tag and fallback naming

## G2-7-026-016  [P2] GAP  facet F04  effort S
- Legacy: notifications.js:171-175 announcement body message/body fallback and default text
- vNext now: announcement-feed.tsx:100-117 title/message from service only
- Fix: Retain fallback for blank notification body

## G2-7-026-066  [P2] GAP  facet F16  effort M
- Legacy: notifications.js:120-128 cards icon left content right, 16px padding and gap12
- vNext now: notification-list.tsx:130-165 phone column, desktop row; announcement-feed.tsx:84-117 separate presentation
- Fix: Match row alignment and spacing on 375/768/1280

## G2-7-026-090  [P2] GAP  facet F23  effort M
- Legacy: notifications.js:383-389 one all-sources empty state
- vNext now: mentor/notifications/page.tsx:119-121,167-170 and announcement-feed.tsx:79-82 three separate empties
- Fix: Show unified no-attention state only when all sources empty
