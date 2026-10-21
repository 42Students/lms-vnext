# Work packet (wave 2): edit src/components/activity/learner-notifications-inbox.tsx

30 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u004-learner-notifications.md, docs/audit/gap2/lane-2/l17-u026-notification-controller.md

## G2-18-004-004  [P2] GAP  facet F01  effort S
- Legacy: Legacy category changes use router.replace shallow without hard reload. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:544-551`
- vNext now: vNext filter changes router.push to new URL (server render). `src/components/activity/learner-notifications-inbox.tsx:103-117`
- Fix: Use replace or preserve back-button semantics for tab changes.

## G2-18-004-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy PageShell wraps ListingPageHeader metrics pills then gray floating notification list. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:612-660`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:615-644`
- vNext now: vNext standalone PageHeader description, separate FilterChip toolbar/search, bordered list. `src/app/(authenticated)/learn/notifications/page.tsx:61-81`, `src/components/activity/learner-notifications-inbox.tsx:120-164`, `src/components/activity/notification-list.tsx:105-111`
- Fix: Match header/pills spacing and floating-list canvas, place enhancements in secondary toolbar.

## G2-18-004-007  [P2] GAP  facet F02  effort S
- Legacy: Legacy category pills embedded in ListingPageHeader `metrics`. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:615-644`
- vNext now: vNext separate nav below header with horizontal scrollbar. `src/components/activity/learner-notifications-inbox.tsx:120-138`
- Fix: Embed categories in page head metrics slot with same wrapping/scroll behavior.

## G2-18-004-008  [P2] GAP  facet F02  effort M
- Legacy: Legacy list uses 5 skeleton rows before first fetch. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:683-690`
- vNext now: vNext first paint awaits server DB then renders data; no same 5-card skeleton in inbox. `src/app/(authenticated)/learn/notifications/page.tsx:23-61`, `src/components/activity/learner-notifications-inbox.tsx:195-214`
- Fix: Add matched route loading.tsx five-card skeleton, test streaming fallback.

## G2-18-004-011  [P2] GAP  facet F03  effort M
- Legacy: Legacy category pills include icons (Bell, Book, Project, Announcement, Job) and numeric count. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:519-530`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:619-642`
- vNext now: vNext filter chip label from category model, no numeric pill count. `src/components/activity/learner-notifications-inbox.tsx:122-137`
- Fix: Add corresponding icons and per-category counts to pills.

## G2-18-004-013  [P2] GAP  facet F03  effort M
- Legacy: Legacy notification click opens detail Modal from whole card click. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:289-302`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:703-707`
- vNext now: vNext `View notification` title Button opens detail Dialog; row actions include Mark read/CTA. `src/components/activity/notification-list.tsx:145-155`, `src/components/activity/notification-list.tsx:165-195`, `src/components/activity/learner-notifications-inbox.tsx:232-259`
- Fix: Make full notification row keyboard-clickable and open same detail while preserving explicit read controls.

## G2-18-004-018  [P2] GAP  facet F04  effort M
- Legacy: Legacy raw rendered notification message allows basic markup tags after sanitization. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:33-34`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:750-752`
- vNext now: vNext body plain whitespace-pre-wrap text. `src/components/activity/learner-notifications-inbox.tsx:255-259`
- Fix: Preserve safe rich text tags where producer sends HTML; sanitize and prevent unsafe URLs.

## G2-18-004-019  [P2] GAP  facet F04  effort M
- Legacy: Legacy context comes from context_label/course_name/receiver_type mapping, then em dash. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:113-132`
- vNext now: vNext announcement uses audience context, personal module badge with optional contextLine. `src/components/activity/learner-notifications-inbox.tsx:74-76`, `src/components/activity/notification-list.tsx:138-161`
- Fix: Recover course/company/recipient context per notification and exact fallbacks.

## G2-18-004-028  [P2] GAP  facet F06  effort S
- Legacy: Legacy category selection ARIA pressed + visual active class; counts attached. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:620-642`
- vNext now: vNext FilterChip aria-pressed and label but no per-category count. `src/components/activity/learner-notifications-inbox.tsx:122-138`
- Fix: Add count span with correct accessible text and no duplicate announcements count.

## G2-18-004-042  [P2] GAP  facet F09  effort S
- Legacy: Legacy detail Modal fixed width 520 and max calc(100vw - 32px), destroyOnClose. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:740-745`
- vNext now: vNext Dialog width inherited from UI library, state retained via selected. `src/components/activity/learner-notifications-inbox.tsx:232-265`
- Fix: Match 520px and viewport cap; clear modal content on close.

## G2-18-004-043  [P2] GAP  facet F09  effort M
- Legacy: Legacy detail rich Markup with allowList and allowed href target rel. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:33-34`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:746-753`
- vNext now: vNext displays plain `<p>` with whitespace-preserve. `src/components/activity/learner-notifications-inbox.tsx:255-260`
- Fix: Safe HTML renderer with restricted allowed tags and sanitizer.

## G2-18-004-056  [P2] GAP  facet F11  effort M
- Legacy: Legacy external assessment target only http(s), opens new window noopener noreferrer. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:72-83`
- vNext now: vNext external announcement CTA insists https and no credentials, personal links internal. `src/components/activity/learner-notifications-inbox.tsx:67-75`, `src/modules/activity/learner-notification-inbox-model.ts:20-25`
- Fix: Map safe http legacy assessment case through reviewed redirect or disallow with explicit reason.

## G2-18-004-061  [P2] GAP  facet F13  effort S
- Legacy: Legacy no notices shows illustrated empty state and `No notifications yet`. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:577-590`
- vNext now: vNext empty text model + explanatory paragraph, without old gradient bell illustration. `src/components/activity/learner-notifications-inbox.tsx:195-208`, `src/components/activity/notification-list.tsx:87-102`
- Fix: Restore illustration, title and subtitle for truly empty inbox.

## G2-18-004-063  [P2] GAP  facet F13  effort M
- Legacy: Legacy partial failure warns while rendering loaded source. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:645-682`
- vNext now: vNext partial announcement warning but a personal source failure SSR error. `src/app/(authenticated)/learn/notifications/page.tsx:23-36`, `src/components/activity/learner-notifications-inbox.tsx:180-186`
- Fix: Render partial with independent source-state counters and Retry.

## G2-18-004-067  [P2] GAP  facet F14  effort M
- Legacy: Legacy rich notification body sanitizes markup and links; no upload. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:33-34`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:750-752`
- vNext now: vNext plaintext message; external announcement CTA allowed after URL check. `src/components/activity/learner-notifications-inbox.tsx:67-75`, `src/components/activity/learner-notifications-inbox.tsx:255-260`
- Fix: Preserve safe formatted content and legitimate anchors, no unsafe user HTML.

## G2-18-004-068  [P2] GAP  facet F14  effort M
- Legacy: Legacy old notices up to 2000 in list before frontend filters; no history pagination button. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:379-391`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:612-711`
- vNext now: vNext list 60 and `/learn/notifications/history` separately. `src/app/(authenticated)/learn/notifications/page.tsx:23-27`, `src/components/activity/learner-notifications-inbox.tsx:175-178`
- Fix: Explain 60-preview cap and offer cursor history with total count.

## G2-18-004-072  [P2] GAP  facet F16  effort M
- Legacy: Legacy page scroll-container and list floats on gray background, notification cards have avatar. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:612-660`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:289-324`
- vNext now: vNext whitespace and bordered list, mobile toolbar shifts fields. `src/components/activity/learner-notifications-inbox.tsx:120-165`, `src/components/activity/notification-list.tsx:130-164`
- Fix: Compare 375/768/1440 widths, restore avatar card behavior.

## G2-18-004-080  [P2] GAP  facet F18  effort S
- Legacy: Legacy filter labels `All`, `Course`, `Project`, `Announcements`, `Job`, each badge count. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:519-530`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:619-643`
- vNext now: vNext new category labels from model; no displayed counts. `src/components/activity/learner-notifications-inbox.tsx:122-137`
- Fix: Match exact labels including plural and case, per-tab counts.

## G2-18-004-083  [P2] GAP  facet F18  effort S
- Legacy: Legacy error labels `Couldn't load notifications`, `Couldn't refresh notifications`. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:593-606`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:664-671`
- vNext now: vNext `Announcements not refreshed` and mark-read errors. `src/components/activity/learner-notifications-inbox.tsx:180-186`, `src/components/activity/notification-list.tsx:73-78`
- Fix: Use exact source-specific wording with correct retry path.

## G2-18-004-087  [P2] GAP  facet F19  effort M
- Legacy: Legacy retry keeps old list while background refresh in progress. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:496-505`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:661-672`
- vNext now: vNext router.refresh and server reassessment can replace content. `src/components/activity/learner-notifications-inbox.tsx:180-186`, `src/app/(authenticated)/learn/notifications/page.tsx:23-39`
- Fix: Preserve last authorized list and show RefreshStatus until new snapshot arrives.

## G2-18-004-094  [P2] GAP  facet F21  effort M
- Legacy: Legacy job assessment external links via window.open noopener. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:72-83`
- vNext now: vNext internal path validation, https-only announcement CTA. `src/modules/activity/learner-notification-inbox-model.ts:20-25`, `src/components/activity/learner-notifications-inbox.tsx:67-75`
- Fix: Provide explicit secure external assessment launch behavior if required.

## G2-17-026-054  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:696-701 No <category> notifications yet / Try another category
- vNext now: src/components/activity/learner-notifications-inbox.tsx:196-207 learnerInboxEmptyLabel and View all
- Fix: Reconcile exact per-tab empty state copy and reset label

## G2-18-004-010  [P3] GAP  facet F02  effort S
- Legacy: Legacy no category result shows PanelEmpty compact within list. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:693-703`
- vNext now: vNext shows NotificationList empty state and Clear filters. `src/components/activity/learner-notifications-inbox.tsx:195-208`, `src/components/activity/notification-list.tsx:87-102`
- Fix: Match PanelEmpty hierarchy and `View all` CTA for single category.

## G2-18-004-032  [P3] GAP  facet F06  effort S
- Legacy: Legacy initial page filter `all` with a bell icon. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:620-630`
- vNext now: vNext default category all, className selected FilterChip. `src/modules/activity/learner-notification-inbox-model.ts:4-8`, `src/components/activity/learner-notifications-inbox.tsx:122-137`
- Fix: Match icon and active pill dimensions.

## G2-18-004-044  [P3] GAP  facet F09  effort S
- Legacy: Legacy detail displays contextual type tag, context, and formatted date below message. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:750-756`
- vNext now: vNext detail label Personal notification/College announcement, badges in meta. `src/components/activity/learner-notifications-inbox.tsx:233-264`
- Fix: Restore exact type/context/date line and order.

## G2-18-004-062  [P3] GAP  facet F13  effort S
- Legacy: Legacy zero tab results shows `No X notifications yet` with `View all`. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:693-703`
- vNext now: vNext generic conditional empty text and Clear filters. `src/components/activity/learner-notifications-inbox.tsx:195-208`
- Fix: Restore category-specific copy and View all.

## G2-18-004-074  [P3] GAP  facet F16  effort S
- Legacy: Legacy category tabs in header may wrap on narrow view. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:615-643`
- vNext now: vNext horizontally scrollable nav row. `src/components/activity/learner-notifications-inbox.tsx:122-138`
- Fix: Match responsive header pill wrap/scroll exactly.

## G2-18-004-077  [P3] GAP  facet F17  effort S
- Legacy: Legacy filter pills have aria-pressed and icon; per-category numeric count. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:620-643`
- vNext now: vNext FilterChip aria-pressed; no counts/icons. `src/components/activity/learner-notifications-inbox.tsx:122-138`
- Fix: Add count and icon with accessible label, prevent redundant announcements.

## G2-18-004-078  [P3] GAP  facet F17  effort S
- Legacy: Legacy list aria-label `Notification list`, aria-busy loading. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:659-663`
- vNext now: vNext section aria-label Learner notifications inbox + nested list, no `Notification list` label. `src/components/activity/learner-notifications-inbox.tsx:120-121`, `src/components/activity/learner-notifications-inbox.tsx:195-214`
- Fix: Keep list landmark `Notification list` with aria-busy when refreshing.

## G2-18-004-082  [P3] GAP  facet F18  effort S
- Legacy: Legacy detail button `Got it`; action `View Course`/`Take Assessment` etc. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:712-738`
- vNext now: vNext Got it and sanitized actionHref title labels. `src/components/activity/learner-notifications-inbox.tsx:232-252`
- Fix: Map original action labels by event subtype.
