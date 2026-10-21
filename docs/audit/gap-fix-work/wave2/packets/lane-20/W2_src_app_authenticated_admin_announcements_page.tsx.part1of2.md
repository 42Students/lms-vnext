# Work packet (wave 2): edit src/app/(authenticated)/admin/announcements/page.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-announcements.md, docs/audit/gap2/lane-11/l19-u024-super-admin-announcement-controller.md, docs/audit/gap2/lane-14/u014-announcement-search-controller.md, docs/audit/gap2/lane-2/admin-notification-delivery-controller.md, docs/audit/gap2/lane-2/admin-recycle-bin-controller.md, docs/audit/gap2/lane-2/announcement-controller.md

## G2-10-002-001  [P2] GAP  facet F01  effort M
- Legacy: Route /superadmin/announcements accessed through Placements tab Announcements `docs/legacy-source/frontend/src/common/superAdminNavGroups.js:74-93` `docs/legacy-source/frontend/src/components/admin/SuperAdminGroupShell.jsx:12-25`
- vNext now: Page is /admin/announcements with heading Announcements; legacy /superadmin/announcements not directly rendered in mapped page `src/app/(authenticated)/admin/announcements/page.tsx:33-46` `src/app/(authenticated)/admin/announcements/page.tsx:126-139`
- Fix: Preserve legacy deep link redirect and Placements tab selection or document canonical navigation mapping

## G2-10-002-002  [P2] GAP  facet F01  effort M
- Legacy: Group shell title Placements with tabs for jobs recruiter accounts announcements `docs/legacy-source/frontend/src/components/admin/SuperAdminGroupShell.jsx:17-28` `docs/legacy-source/frontend/src/common/superAdminNavGroups.js:74-93`
- vNext now: Announcement page uses independent PageHeader title Announcements without visible group tab construction `src/app/(authenticated)/admin/announcements/page.tsx:126-139`
- Fix: Use unified Placements grouped tab strip and legacy active announcement tab

## G2-10-002-003  [P2] GAP  facet F01  effort S
- Legacy: New announcement top-right primary action opens composer `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:66-69`
- vNext now: Header right action toggles Include deleted; broadcast composer is below filters in Disclosure `src/app/(authenticated)/admin/announcements/page.tsx:128-140` `src/app/(authenticated)/admin/announcements/page.tsx:180-180` `src/components/announcements/super-admin-college-broadcast-form.tsx:57-59`
- Fix: Put New announcement primary button in page head that opens broadcast composer

## G2-10-002-004  [P2] GAP  facet F02  effort M
- Legacy: Top-to-bottom section order placements tabs and New announcement action; subtitle; error; card feed `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:66-76`
- vNext now: Heading; deleted toggle; search and filters; broadcast disclosure; receipt section; generic history; CSV; older link `src/app/(authenticated)/admin/announcements/page.tsx:126-214`
- Fix: Restore legacy broadcast entry hierarchy; place extras in separate clearly labeled management section

## G2-10-002-005  [P2] GAP  facet F02  effort M
- Legacy: Composer is detached 600px AsyncModal outside feed `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:78-109`
- vNext now: Composer appears as collapsible in-page Disclosure within report stream `src/components/announcements/super-admin-college-broadcast-form.tsx:57-109` `src/app/(authenticated)/admin/announcements/page.tsx:180-180`
- Fix: Convert placement-cell composer to old dialog geometry and flow

## G2-10-002-016  [P2] GAP  facet F04  effort M
- Legacy: Legacy card has sender update state recipient count and link fields from one broadcast row `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:338-349`
- vNext now: Rows use generic receiver type/id title message senderType version visibilityState `src/app/(authenticated)/admin/announcements/page.tsx:93-110`
- Fix: Add old author audienceLabel recipientCount readCount and updatedAt in broadcast list projection

## G2-10-002-042  [P2] GAP  facet F10  effort M
- Legacy: Legacy GET list and GET placement-cells endpoints `docs/legacy-source/frontend/src/api/Services/AdminService.js:1184-1189` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAnnouncementController.java:28-38`
- vNext now: New server page directly calls listAnnouncementsForAdmin and listSuperAdminBroadcastColleges `src/app/(authenticated)/admin/announcements/page.tsx:65-80`
- Fix: Document endpoint mapping; ensure identical list and placement-cell audience semantics

## G2-10-002-049  [P2] GAP  facet F11  effort S
- Legacy: Legacy super-admin pages remain visible despite module disabled `docs/legacy-source/frontend/src/components/admin/SuperAdminGroupShell.jsx:12-17`
- vNext now: New runtime DB gate returns announcements unavailable message when flag off `src/app/(authenticated)/admin/announcements/page.tsx:50-63` `src/modules/announcements/readiness.ts:1-13`
- Fix: Differentiate module access from missing DB migration and keep superadmin navigation visible

## G2-10-002-055  [P2] GAP  facet F13  effort S
- Legacy: Legacy list initial null renders four-row active skeleton `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:20-35` `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:50-51`
- vNext now: Server-rendered page plus loading route; no matching list skeleton in page source `src/app/(authenticated)/admin/announcements/page.tsx:33-80`
- Fix: Use old four-row skeleton for initial feed state in loading boundary

## G2-10-002-056  [P2] GAP  facet F13  effort M
- Legacy: Legacy fetch failure gives Couldn't load announcements and Retry; college fetch failure silently empties picker `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:28-35` `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:68-71`
- vNext now: New DB-disabled state shows operator migration instructions and query invalid reset; no visible per-list Retry in page `src/app/(authenticated)/admin/announcements/page.tsx:42-63`
- Fix: Provide user-facing list recovery with Retry while keeping diagnostics separate from end-user UI

## G2-10-002-057  [P2] GAP  facet F13  effort S
- Legacy: Legacy zero broadcast list message Nothing sent yet. `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:71-71` `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:50-51`
- vNext now: Generic history empty No announcements plus contextual empty text `src/components/announcements/announcement-admin-workspace.tsx:283-286` `src/app/(authenticated)/admin/announcements/page.tsx:193-196`
- Fix: Restore exact empty wording for placement-cell broadcast feed

## G2-10-002-067  [P2] GAP  facet F18  effort S
- Legacy: Legacy main action New announcement; modal heading New announcement to placement cells `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:68-68` `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:78-79`
- vNext now: Disclosure heading New announcement to placement cells; page action Include deleted `src/app/(authenticated)/admin/announcements/page.tsx:128-138` `src/components/announcements/super-admin-college-broadcast-form.tsx:57-57`
- Fix: Restore page head New announcement action and preserve dialog heading

## G2-10-002-072  [P2] GAP  facet F19  effort M
- Legacy: Legacy full-list database query with no pagination or hard limit on history `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:338-349`
- vNext now: New history limit 50 and Older cursor; recipients list max 500 `src/app/(authenticated)/admin/announcements/page.tsx:65-80` `src/app/(authenticated)/admin/announcements/page.tsx:207-213` `src/modules/announcements/super-admin-college-broadcast-service.ts:32-38`
- Fix: Document page-50 navigation and cap; add broadcast-aware paging or preserve full feed if practical

## G2-19-024-001  [P2] GAP  facet F01  effort M
- Legacy: GET, placement-cells picker, POST, PUT/{id}, DELETE/{id} under /api/v1/superadmin/announcements; SuperAdminAnnouncementController.java:21-55
- vNext now: /admin/announcements server page and POST /api/admin/announcements/broadcast; admin/announcements/page.tsx:126-142; admin/announcements/broadcast/route.ts:7-17
- Fix: Crosswalk each of five legacy routes, including scoped read/update/delete of a broadcast as a single entity.

## G2-19-024-002  [P2] GAP  facet F01  effort M
- Legacy: Old Placements > Announcements tab, New announcement header action; superadmin/announcements.js:65-70
- vNext now: New page header action `Include deleted`, broadcast composer further down; admin/announcements/page.tsx:126-141,180
- Fix: Place New announcement in the page-head right action and retain Placements grouped tab/legacy redirect.

## G2-19-024-003  [P2] GAP  facet F02  effort M
- Legacy: Top title and subtitle, error/retry, announcement feed, 600px create/edit modal; superadmin/announcements.js:65-109
- vNext now: Page head, filters, inline composer, receipts, generic list, export, older link; admin/announcements/page.tsx:126-214
- Fix: Preserve old hierarchy and modal; group new admin filters/export in a distinct secondary section.

## G2-19-024-008  [P2] GAP  facet F04  effort S
- Legacy: Legacy end status from showUntil UTC; PlacementAnnouncementService.java:345-349
- vNext now: New expiresAt and visibilityState in generic feed; admin/announcements/page.tsx:92-114
- Fix: Use a shared broadcast expiry semantics and match `Ended` copy on author card.

## G2-19-024-009  [P2] GAP  facet F05  effort M
- Legacy: Legacy superadmin list all un-deleted broadcasts, pinned first/id descending; PlacementAnnouncementService.java:338-349
- vNext now: Generic admin list server cursor page and filters by receiver/pinned/status; admin/announcements/page.tsx:141-214
- Fix: Keep pinned-first default order and filter to superadmin-to-TPO group instead of mixing generic announcements.

## G2-19-024-024  [P2] GAP  facet F10  effort M
- Legacy: GET list -> allFrom42 and GET placement-cells -> placementCells; controller.java:28-38
- vNext now: Server-side queries listAnnouncementsForAdmin and listSuperAdminBroadcastColleges; admin/announcements/page.tsx:65-80
- Fix: Read/group only 42-to-placement-cell broadcasts and show correct reachable colleges list.

## G2-19-024-031  [P2] GAP  facet F12  effort M
- Legacy: Legacy pinned list sorts first and expiry `ended` computed; PlacementAnnouncementService.java:338-349
- vNext now: Generic server returns visibilityState but no broadcast grouped pin ordering; admin/announcements/page.tsx:93-114
- Fix: Apply pinned-first sort with expired representation after grouping.

## G2-19-024-032  [P2] GAP  facet F13  effort S
- Legacy: Legacy failed load `Couldn't load announcements` and Retry; zero list `Nothing sent yet`; superadmin/announcements.js:28-34,68-75
- vNext now: vNext generic empty/filter states and backend DB readiness error; admin/announcements/page.tsx:43-63,193-196
- Fix: Restore exact loading skeleton, Retry, and broadcast-specific no-data text.

## G2-14-014-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy public-path controller requires auth, mounted /api/v2/announcements/search `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchController.java:18-23` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchController.java:33-55`
- vNext now: New admin announcement list uses separate authenticated API and pages `src/modules/announcements/service.ts:193-252` `src/app/(authenticated)/admin/announcements/page.tsx:33-80`
- Fix: Document new list route as replacement and provide scoped legacy adapter only if callers remain

## G2-14-014-007  [P2] GAP  facet F03  effort M
- Legacy: Legacy DTO fields id, title, message, receiverType, receiverValue `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchDTO.java:13-19`
- vNext now: New projection has title,message,receiverType,UUID receiverId plus sender/schedule/pin/time `src/app/(authenticated)/admin/announcements/page.tsx:94-112` `src/db/schema/db10-announcements.ts:21-43`
- Fix: Map receiverValue integer to receiverId UUID and original response keys

## G2-14-014-039  [P2] GAP  facet F13  effort S
- Legacy: Legacy empty result appears as empty list with success `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchController.java:54-56` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchCache.java:36-44`
- vNext now: New admin UI can show filtered no-results via workspace `src/app/(authenticated)/admin/announcements/page.tsx:193-197`
- Fix: Show distinct no matches vs no announcements copy

## G2-14-014-049  [P2] GAP  facet F18  effort S
- Legacy: Legacy route parameter query and message Announcements retrieved `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchController.java:41-55`
- vNext now: New UI param q, label Search announcement title or message `src/app/(authenticated)/admin/announcements/page.tsx:140-143`
- Fix: Provide query alias and exact optional legacy message in adapter

## G2-2-019-005  [P2] GAP  facet F02  effort M
- Legacy: AdminNotificationDeliveryController.java:22-30 operator controller supplies no page layout; M2 requires delivery status, resend/retry
- vNext now: src/app/(authenticated)/admin/announcements/page.tsx:126-188 filters, composer, read receipts; no status/failure operator panel
- Fix: Add distinct scheduled/failed/sent delivery status list before receipts.

## G2-2-019-006  [P2] GAP  facet F02  effort M
- Legacy: NotificationRepository.java:39-68 college-scoped paged records; delivery fields in Notification.java:88-105
- vNext now: src/app/(authenticated)/admin/announcements/page.tsx:94-110 maps visibility, not delivery status or failure
- Fix: Show scheduled/delivery status separate from visible/expired labels.

## G2-2-019-009  [P2] GAP  facet F03  effort M
- Legacy: AdminNotificationDeliveryController.java:99-103 response returns id and `deliveryStatus`
- vNext now: src/app/(authenticated)/admin/announcements/page.tsx:94-110 maps id, visibilityState but no status
- Fix: Display explicit queued/sent/failed/cancelled state.

## G2-2-019-010  [P2] GAP  facet F03  effort M
- Legacy: Notification.java:100-105 deliveryError and deliveredAt fields
- vNext now: src/app/(authenticated)/admin/announcements/page.tsx:94-110 does not map deliveryError/deliveredAt
- Fix: Provide failure tooltip and delivery timestamp.

## G2-2-019-014  [P2] GAP  facet F05  effort M
- Legacy: NotificationRepository.java:39-68 admin college-scope list ordered id DESC
- vNext now: src/app/(authenticated)/admin/announcements/page.tsx:65-80 loads 50 with cursor; not notification delivery rows
- Fix: Offer scoped notification delivery table ordered newest or configurable due time.

## G2-2-019-044  [P2] GAP  facet F13  effort M
- Legacy: AdminNotificationDeliveryController.java:72-86 returns missing/not allowed/already delivered distinctly
- vNext now: src/app/(authenticated)/admin/announcements/page.tsx:50-63 runtime-not-ready gate, but no operator error states
- Fix: Render pending, invalid-state, permission, not-found and failed-delivery recovery.

## G2-2-023-009  [P2] GAP  facet F03  effort M
- Legacy: AdminRecycleBinController.java:232-253 row-specific restore POST
- vNext now: src/app/(authenticated)/admin/announcements/page.tsx:128-139 includes deleted toggle; separate actions
- Fix: Attach Restore action to row with typed target name.

## G2-2-023-012  [P2] GAP  facet F04  effort M
- Legacy: AdminRecycleBinController.java:210-214 GET items `{id,name,subtitle}`
- vNext now: src/app/(authenticated)/admin/announcements/page.tsx:94-110 announcement-specific fields
- Fix: Normalize row summaries for every soft-deletable type.

## G2-2-023-019  [P2] GAP  facet F06  effort M
- Legacy: AdminRecycleBinController.java:236-239 restore entityType,id,collegeId query
- vNext now: src/app/(authenticated)/admin/announcements/page.tsx:94-109 UUID row IDs with version
- Fix: Provide UUID typed IDs with persisted scope, migration-aware mapping.

## G2-2-023-058  [P2] GAP  facet F21  effort M
- Legacy: AdminRecycleBinController.java:33-37 delegates bespoke course/lesson/announcement restores
- vNext now: src/app/(authenticated)/admin/announcements/page.tsx:65-69 includes deleted, courses and lessons individual pages
- Fix: Link bespoke recovery panels from central index without duplicate persistence logic.

## G2-2-025-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy superadmin/announcements.js:66-79 placement cells page with modal and list
- vNext now: src/app/(authenticated)/admin/announcements/page.tsx:126-194 global announcement directory and TPO broadcast form
- Fix: Separate platform placement-cell broadcaster from general announcement composer as old UI.

## G2-2-025-007  [P2] GAP  facet F02  effort M
- Legacy: AnnouncementController.java:82-103 admin list page applies inherited college scope
- vNext now: src/app/(authenticated)/admin/announcements/page.tsx:65-80 selected search, receiver, status and 50 limit
- Fix: Preserve table/list hierarchy with scoped college display and counts.

## G2-2-025-009  [P2] GAP  facet F03  effort M
- Legacy: Legacy superadmin/announcements.js:68-75 New announcement button, Edit/Delete
- vNext now: src/app/(authenticated)/admin/announcements/page.tsx:126-193 composer, receipt panel, history workspace
- Fix: Keep New announcement entry and row edit/delete actions visible.

## G2-2-025-012  [P2] GAP  facet F04  effort M
- Legacy: AnnouncementResponseDTO.java:14-26 id,receiverValue,senderName/senderType,created_at array,schedule,expiry,pin
- vNext now: src/app/(authenticated)/admin/announcements/page.tsx:94-110 uses UUID,ISO createdAt,visibility
- Fix: Map legacy response fields including optional sender label and 0-based month array if adapter needed.

## G2-2-025-046  [P2] GAP  facet F13  effort M
- Legacy: Legacy superadmin/announcements.js:28-35 list failure Retry visible
- vNext now: src/app/(authenticated)/admin/announcements/page.tsx:50-63 runtime-not-ready ErrorState
- Fix: Offer retry on query outage, not only migration gate.
