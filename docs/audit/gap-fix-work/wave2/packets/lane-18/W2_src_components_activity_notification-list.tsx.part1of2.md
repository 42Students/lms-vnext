# Work packet (wave 2): edit src/components/activity/notification-list.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u004-learner-notifications.md, docs/audit/gap2/lane-2/l17-u026-notification-controller.md, docs/audit/gap2/lane-6/teacher-notifications.md, docs/audit/gap2/lane-7/u026-mentor-notifications.md, docs/audit/gap2/lane-8/l11-u018-tpo-notifications.md, docs/audit/gap2/lane-8/notification.md

## G2-18-004-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy PageShell wraps ListingPageHeader metrics pills then gray floating notification list. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:612-660`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:615-644`
- vNext now: vNext standalone PageHeader description, separate FilterChip toolbar/search, bordered list. `src/app/(authenticated)/learn/notifications/page.tsx:61-81`, `src/components/activity/learner-notifications-inbox.tsx:120-164`, `src/components/activity/notification-list.tsx:105-111`
- Fix: Match header/pills spacing and floating-list canvas, place enhancements in secondary toolbar.

## G2-18-004-009  [P2] GAP  facet F02  effort M
- Legacy: Legacy row is floating gray-background rounded card with avatar, title, snippet, context/date. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:289-324`
- vNext now: vNext item is border-bottom text row with module badge and full body. `src/components/activity/notification-list.tsx:130-165`
- Fix: Clone row avatar/icon, card background/radius/margins and 80-char summary.

## G2-18-004-013  [P2] GAP  facet F03  effort M
- Legacy: Legacy notification click opens detail Modal from whole card click. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:289-302`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:703-707`
- vNext now: vNext `View notification` title Button opens detail Dialog; row actions include Mark read/CTA. `src/components/activity/notification-list.tsx:145-155`, `src/components/activity/notification-list.tsx:165-195`, `src/components/activity/learner-notifications-inbox.tsx:232-259`
- Fix: Make full notification row keyboard-clickable and open same detail while preserving explicit read controls.

## G2-18-004-019  [P2] GAP  facet F04  effort M
- Legacy: Legacy context comes from context_label/course_name/receiver_type mapping, then em dash. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:113-132`
- vNext now: vNext announcement uses audience context, personal module badge with optional contextLine. `src/components/activity/learner-notifications-inbox.tsx:74-76`, `src/components/activity/notification-list.tsx:138-161`
- Fix: Recover course/company/recipient context per notification and exact fallbacks.

## G2-18-004-021  [P2] GAP  facet F04  effort S
- Legacy: Legacy general category displays badge `Announcement` for fallback types. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:50-57`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:135-143`
- vNext now: vNext personal module badge may display technical module; announcement source uses `Announcement`. `src/components/activity/notification-list.tsx:138-144`
- Fix: Map fallback module enum to legacy tag label and color.

## G2-18-004-031  [P2] GAP  facet F06  effort M
- Legacy: Legacy notification click whole card is native button, not role=button div. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:289-301`
- vNext now: vNext row article and title button; context links separately. `src/components/activity/notification-list.tsx:130-155`
- Fix: Use native full-width button for open detail without nested interactive controls.

## G2-18-004-058  [P2] GAP  facet F12  effort M
- Legacy: Legacy plain class/broadcast notices shown unread-neutral (no per-user isRead mutation). `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:54-74`
- vNext now: vNext personal unread status with module marker and announcements always read-less. `src/components/activity/notification-list.tsx:138-144`, `src/modules/activity/learner-notification-inbox-model.ts:26-35`
- Fix: Preserve nonpersonal broadcast designation and not falsely count unread.

## G2-18-004-061  [P2] GAP  facet F13  effort S
- Legacy: Legacy no notices shows illustrated empty state and `No notifications yet`. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:577-590`
- vNext now: vNext empty text model + explanatory paragraph, without old gradient bell illustration. `src/components/activity/learner-notifications-inbox.tsx:195-208`, `src/components/activity/notification-list.tsx:87-102`
- Fix: Restore illustration, title and subtitle for truly empty inbox.

## G2-18-004-072  [P2] GAP  facet F16  effort M
- Legacy: Legacy page scroll-container and list floats on gray background, notification cards have avatar. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:612-660`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:289-324`
- vNext now: vNext whitespace and bordered list, mobile toolbar shifts fields. `src/components/activity/learner-notifications-inbox.tsx:120-165`, `src/components/activity/notification-list.tsx:130-164`
- Fix: Compare 375/768/1440 widths, restore avatar card behavior.

## G2-18-004-083  [P2] GAP  facet F18  effort S
- Legacy: Legacy error labels `Couldn't load notifications`, `Couldn't refresh notifications`. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:593-606`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:664-671`
- vNext now: vNext `Announcements not refreshed` and mark-read errors. `src/components/activity/learner-notifications-inbox.tsx:180-186`, `src/components/activity/notification-list.tsx:73-78`
- Fix: Use exact source-specific wording with correct retry path.

## G2-18-004-097  [P2] GAP  facet F22  effort M
- Legacy: Legacy created_at JDBC serialized sometimes as `[year,month0,day]` array. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:242-254`
- vNext now: vNext DB timestamptz to ISO; Intl IST frontend. `src/app/(authenticated)/learn/notifications/page.tsx:50-56`, `src/components/activity/notification-list.tsx:31-39`
- Fix: Normalize source dates including zero-indexed month without timezone drift.

## G2-17-026-050  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/hooks/useNotificationFeed.js:13-18 feed shared with mobile footer
- vNext now: src/components/activity/notification-list.tsx:130-171 mobile-first stacked actions min-[768px] flex
- Fix: Ensure mobile footer badges and live updates stay synced with new inbox transport

## G2-17-026-053  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:582-587 No notifications yet / You'll see course updates and announcements here when available
- vNext now: src/components/activity/notification-list.tsx:89-99 generic empty helper text Workflow notifications and announcements appear...
- Fix: Restore category and role-specific exact legacy empty-state wording

## G2-6-008-005  [P2] GAP  facet F02  effort M
- Legacy: Old list rows float directly over gray background in learn-notifications-page `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:612-713`
- vNext now: New list renders bordered/divided grouped cards `src/components/activity/notification-list.tsx:106-132`
- Fix: Match row shell, background, spacing, hover, and dividers

## G2-6-008-008  [P2] GAP  facet F03  effort S
- Legacy: Old row has bell avatar icon `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:295-307`
- vNext now: New personal row uses grouped date text/status badge with no bell avatar `src/components/activity/notification-list.tsx:114-131` `src/components/activity/notification-list.tsx:132-164`
- Fix: Add legacy bell icon square avatar and hit area

## G2-6-008-009  [P2] GAP  facet F03  effort M
- Legacy: Old type tag colored via notification type catalog `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:50-56` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:309-312`
- vNext now: New personal row renders new/unread badges and module information `src/components/activity/notification-list.tsx:122-127` `src/components/activity/notification-list.tsx:139-157`
- Fix: Show legacy type tag alongside readable source badge

## G2-6-008-010  [P2] GAP  facet F03  effort S
- Legacy: Old each row snippet truncates at 80 chars plus `...` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:288-293`
- vNext now: New row displays full body `src/components/activity/notification-list.tsx:123-127` `src/components/activity/notification-list.tsx:158-162`
- Fix: Apply 80-character list preview without truncating detail content

## G2-6-008-012  [P2] GAP  facet F04  effort M
- Legacy: Old item title defaults to `Notification`; context derived from courseName/receiverType with dash fallback `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:113-132` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:308-320`
- vNext now: New uses notification.title and only event.module with readAt/date `src/app/(authenticated)/teacher/notifications/page.tsx:60-69` `src/components/activity/notification-list.tsx:139-163`
- Fix: Restore context_label/course/receiver fallback metadata per notification row

## G2-6-008-013  [P2] GAP  facet F04  effort M
- Legacy: Old date uses shared formatNotificationDate on created_at, supports legacy `[year,month,day]` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:242-253` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:318-319`
- vNext now: New personal createdAt ISO and client formatWhen `src/app/(authenticated)/teacher/notifications/page.tsx:60-69` `src/components/activity/notification-list.tsx:127-127`
- Fix: Normalize legacy Java date arrays and match IST presentation

## G2-6-008-014  [P2] GAP  facet F04  effort M
- Legacy: Old notification message rendered sanitized Markup with limited tags `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:33-34` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:313-315`
- vNext now: New body is plain text paragraph `src/components/activity/notification-list.tsx:126-127` `src/components/activity/notification-list.tsx:158-162`
- Fix: Restore safe rich-text formatting allowlist with strict URL sanitization

## G2-6-008-023  [P2] MISSING  facet F06  effort M
- Legacy: Old modal detail has `Got it` primary button `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:714-746`
- vNext now: New notification list uses mark-as-read and navigation buttons, no `Got it` detail form `src/components/activity/notification-list.tsx:114-131` `src/components/activity/notification-list.tsx:165-196`
- Fix: Add detail modal with old primary dismissal semantics

## G2-6-008-033  [P2] MISSING  facet F09  effort M
- Legacy: Old detail Modal destroyOnClose and maxWidth calc(100vw-32px) `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:714-747`
- vNext now: New no modal in list `src/components/activity/notification-list.tsx:106-208`
- Fix: Implement modal mobile width and unmount on close

## G2-6-008-051  [P2] GAP  facet F16  effort M
- Legacy: Old notification modal max-width `calc(100vw - 32px)` and row cards scroll on mobile `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:714-747` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:295-323`
- vNext now: New list uses flex/wrap and responsive action buttons `src/components/activity/notification-list.tsx:132-196`
- Fix: Restore legacy 520px dialog with responsive margin and card density

## G2-6-008-053  [P2] GAP  facet F17  effort S
- Legacy: Old row button has aria-label `title from context` `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:295-301`
- vNext now: New row heading button/mark-read labels differ `src/components/activity/notification-list.tsx:114-163`
- Fix: Restore row-specific accessible label with context and notification type

## G2-6-008-055  [P2] MISSING  facet F17  effort M
- Legacy: Old modal focus controlled by Ant Modal open/destroyOnClose `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:714-747`
- vNext now: New no modal, action may route immediately `src/components/activity/notification-list.tsx:61-86`
- Fix: Restore focus trap, ESC closing, focus return to opened row

## G2-7-026-007  [P2] GAP  facet F02  effort M
- Legacy: notifications.js:391-395 all rows spaced 12px as ln-card
- vNext now: notification-list.tsx:105-134 date sections, hairline rows; announcement-feed.tsx:84-88 separated
- Fix: Align row container, separators and section gaps

## G2-7-026-010  [P2] GAP  facet F03  effort M
- Legacy: notifications.js:102-129 notification row shows icon, bold title, colored Tag, description
- vNext now: notification-list.tsx:130-165 badge above title, text and datetime, per-item actions
- Fix: Reproduce exact icon-title-tag-description hierarchy

## G2-7-026-011  [P2] GAP  facet F03  effort S
- Legacy: notifications.js:385-389 green CheckCircle empty graphic
- vNext now: mentor/notifications/page.tsx:167-170 plain empty paragraph; notification-list.tsx:87-101 text only
- Fix: Restore green success graphic for empty unified feed

## G2-7-026-017  [P2] GAP  facet F04  effort M
- Legacy: notifications.js:151-161 dates parse Jackson array and ISO; unknown -> 0
- vNext now: notification-list.tsx:31-39 Intl en-IN IST for ISO timestamps
- Fix: Map legacy date-array timestamps and consistent date/time output

## G2-7-026-059  [P2] GAP  facet F13  effort M
- Legacy: notifications.js:383-389 green empty after all sources loaded
- vNext now: notification-list.tsx:87-101 personal-specific empty plus :167-170 project empty
- Fix: Show unified empty when every source is empty

## G2-7-026-066  [P2] GAP  facet F16  effort M
- Legacy: notifications.js:120-128 cards icon left content right, 16px padding and gap12
- vNext now: notification-list.tsx:130-165 phone column, desktop row; announcement-feed.tsx:84-117 separate presentation
- Fix: Match row alignment and spacing on 375/768/1280

## G2-7-026-068  [P2] GAP  facet F17  effort M
- Legacy: notifications.js:118-128 actionable Link wraps full notification row
- vNext now: notification-list.tsx:165-198 heading text and explicit Open or Mark read buttons
- Fix: Match full-row click/focus affordance, ensure read state accessible

## G2-11-018-006  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/tpo/notifications.js:151-172 item has unread dot, title, blue New Tag, body, 'D MMM, h:mm A', right ArrowRight icon.
- vNext now: src/components/activity/notification-list.tsx:118-142 TPO button shows title, 'New' badge, body, combined medium IST time, arrow.
- Fix: Match date shorthand and blue chip/icon alignment; preserve clickable entire row.

## G2-11-018-009  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/tpo/notifications.js:97-101 grouping uses dj on createdAt, :167 date 'D MMM, h:mm A'.
- vNext now: src/components/activity/notification-list.tsx:27-35 Intl en-IN medium + short time; different punctuation/year, but IST explicit.
- Fix: Match legacy 'D MMM, h:mm A' time format.

## G2-11-018-031  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/tpo/notifications.js:139-140 filtered-empty text: 'No unread notifications' vs 'Nothing yet'; older unread explanation.
- vNext now: src/app/(authenticated)/tpo/notifications/page.tsx:98-108 and src/components/activity/notification-list.tsx:79-101 preserves both empty strings, but no filtered-window olderUnread alternate when cursor page empty.
- Fix: Keep exact empty/older-unread distinction for limit/window cases.

## G2-11-018-035  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/notifications.js:143-174 AntD List in single column, cards and segmented controls; responsive old CSS uses .tpo-notifications.
- vNext now: src/components/activity/notification-list.tsx:110-143 full width row buttons with 44px min touch target, src/components/activity/notification-toolbar.tsx:59-81 stacks on phone.
- Fix: Match 375/768/1280 screenshot row height, card width and all/unread segmented appearance.

## G2-11-018-039  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/tpo/notifications.js:167 timestamp 'D MMM, h:mm A'
- vNext now: src/components/activity/notification-list.tsx:27-35 Intl medium short includes year; mismatch.
- Fix: Render same timestamp format without year.

## G2-8-018-005  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:714-760: detail overlay for a selected notification
- vNext now: src/components/activity/notification-list.tsx:105-198: in-row action rather than detail modal
- Fix: Restore detail dialog structure with contextual CTA and Close.

## G2-8-018-006  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:289-322: avatar, type tag, title, markup excerpt, context/date
- vNext now: src/components/activity/notification-list.tsx:105-166: title/body, New/Unread badge, module
- Fix: Render old avatar/icon, colored type badge, context text and date format.

## G2-8-018-009  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:714-744: Close button and contextual View CTA
- vNext now: src/components/activity/notification-list.tsx:166-197: View/Mark read inline
- Fix: Expose legacy contextual modal buttons.
