# Work packet (wave 2): edit src/app/(authenticated)/admin/inbound-mail/page.tsx

31 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-inbound-mail.md, docs/audit/gap2/lane-5/u026-public-inbound-email-controller.md, docs/audit/gap2/lane-8/l13-u024-superadmin-inbound-mail-controller.md

## G2-10-009-002  [P2] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:110-115` PageShell title Inbound mail plus first-paragraph functional description
- vNext now: `src/app/(authenticated)/admin/inbound-mail/page.tsx:19` PageHeader eyebrow Super Admin and Private incoming messages summary
- Fix: Restore exact old intro and remove unwanted eyebrow

## G2-10-009-005  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:108-127` order title, explanation, segmented views, search, error/table
- vNext now: `src/app/(authenticated)/admin/inbound-mail/page.tsx:48-76` order header, tabs, large filter form, inbound card list
- Fix: Restore one compact segmented+search toolbar followed directly by table

## G2-10-009-008  [P2] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:115-119` view segmented and search same horizontal Space wrap
- vNext now: `src/app/(authenticated)/admin/inbound-mail/page.tsx:49-72` separate Tabs then bordered stacked filter form
- Fix: Match 12px toolbar bottom margin and inline search width300

## G2-10-009-030  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:117-119` Input.Search onSearch trims and resets page zero
- vNext now: `src/app/(authenticated)/admin/inbound-mail/page.tsx:56-60` explicit Filter submit with q maxlength120
- Fix: Restore search on enter/click search and zero-based page reset; preserve typed-only draft

## G2-10-009-033  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:123-126` Ant table pagination page+1 display total/pageSize and showSizeChanger=false
- vNext now: `src/app/(authenticated)/admin/inbound-mail/page.tsx:34-36`,77-85 custom numbered pages and Prev/Next, fixed50
- Fix: Match legacy pagination current page/range/count and style

## G2-10-009-038  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:117-118` Search sender, subject or text with allowClear
- vNext now: `src/app/(authenticated)/admin/inbound-mail/page.tsx:57-58` Sender, subject or message body with maxLength120
- Fix: Restore exact placeholder and clear affordance

## G2-10-009-076  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:59-66` no dedicated list loading state; Table loading={!data}
- vNext now: `src/app/(authenticated)/admin/inbound-mail/loading.tsx:1` route Loading inbound mail… role status; `src/app/(authenticated)/admin/inbound-mail/page.tsx:48-88` no client refresh spinner
- Fix: Match table spinner and retain view while pending

## G2-10-009-077  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:120-126` error shows warning banner and Retry, no empty table on error
- vNext now: `src/app/(authenticated)/admin/inbound-mail/error.tsx:4-7` full ErrorState, `src/app/(authenticated)/admin/inbound-mail/page.tsx:29-33` undeployed schema warning
- Fix: Retain contextual retry banner without misleading empty state

## G2-10-009-088  [P2] GAP  facet F16  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:115-119` Space wrap segmented and width300 Search
- vNext now: `src/app/(authenticated)/admin/inbound-mail/page.tsx:49-72` separate Tabs and grid; phone single column
- Fix: Match legacy spacing and wrapping at 1280/768/375

## G2-10-009-095  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:111-114` exact Every email sent to a 42lms.com address... introduction
- vNext now: `src/app/(authenticated)/admin/inbound-mail/page.tsx:19` description Private incoming messages. No automatic replies...
- Fix: Restore introductory wording verbatim

## G2-10-009-096  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:12-17` To read / Posted to conversations / Done / All
- vNext now: `src/app/(authenticated)/admin/inbound-mail/page.tsx:46-47` To read / Being handled / Done / All
- Fix: Restore Posted to conversations label

## G2-10-009-097  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:117` placeholder Search sender, subject or text
- vNext now: `src/app/(authenticated)/admin/inbound-mail/page.tsx:58` Sender, subject or message body
- Fix: Use exact placeholder

## G2-5-026-036  [P2] GAP  facet F15  effort M
- Legacy: Legacy failures retained for manual follow-up rather than replying automatically. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:95-123`
- vNext now: vNext inbox UI says no automatic replies, but failed recruiter reply unretained. `src/app/(authenticated)/admin/inbound-mail/page.tsx:16-19`, `src/app/api/internal/placements/recruiter-message-inbound/route.ts:19-25`
- Fix: Preserve no-auto-reply and manual failure triage.

## G2-5-026-040  [P2] GAP  facet F17  effort M
- Legacy: Legacy statuses are machine-readable, operator sees explanation via Inbox. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:69-73`
- vNext now: vNext triage tabs human-readable but rejection classification absent. `src/app/(authenticated)/admin/inbound-mail/page.tsx:19-19,45-55`
- Fix: Render accessible rejection status/reason in admin detail.

## G2-5-026-042  [P2] GAP  facet F18  effort M
- Legacy: Legacy textual distinction recruiter conversation versus OTHER email for Super Admin. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:22-33`
- vNext now: vNext title Inbound mail but subheading `Private incoming messages` lacks explicit source/triage meaning. `src/app/(authenticated)/admin/inbound-mail/page.tsx:19-19`
- Fix: Explain general mailbox and recruiter reply failure intake in description.

## G2-13-024-001  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:24-26 GET /api/v1/superadmin/inbound-mail global inbox
- vNext now: src/app/(authenticated)/admin/inbound-mail/page.tsx:16-19 /admin/inbound-mail dashboard and src/modules/inbound-mail/admin-service.ts:60-64 requires global super-admin context
- Fix: Register legacy deep-link redirect and preserve global inbox navigation

## G2-13-024-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:108-127 compact PageShell + Segmented + search + Table
- vNext now: src/app/(authenticated)/admin/inbound-mail/page.tsx:19,45-76 PageHeader Tabs and filter form/card list
- Fix: Restore compact segmented toolbar/table layout at the corresponding page

## G2-13-024-005  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:128-146 full-message Drawer 640px with header action
- vNext now: src/app/(authenticated)/admin/inbound-mail/page.tsx:73-76 delegates to card drawer rather than legacy table
- Fix: Preserve right drawer width640, title action and full read state

## G2-13-024-009  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:84-104 Received, From, Email, Status table columns
- vNext now: src/app/(authenticated)/admin/inbound-mail/page.tsx:73-76 mapped card row component, no table columns
- Fix: Render exact 4-column desktop table and click-through drawer

## G2-13-024-021  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:117-119 Input.Search search-on-submit with allowClear
- vNext now: src/app/(authenticated)/admin/inbound-mail/page.tsx:56-72 GET form with Filter and Clear
- Fix: Restore inline searchable field and allowClear visual control

## G2-13-024-037  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:123-126 loading table, open-empty 'Nothing waiting to be read', other 'No emails'
- vNext now: src/app/(authenticated)/admin/inbound-mail/page.tsx:73-76 list abstraction with different empty state; preserve missing-table alert separately
- Fix: Restore empty messages differentiated by selected view and skeleton/table loading states

## G2-13-024-042  [P2] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:115-119 controls inline wrap and fixed search width300
- vNext now: src/app/(authenticated)/admin/inbound-mail/page.tsx:56-72 responsive grid, expandable recipient/status form
- Fix: Match old toolbar alignment/density across breakpoints

## G2-13-024-043  [P2] GAP  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:125 onRow click opens drawer; docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:128-146 drawer close button
- vNext now: src/app/(authenticated)/admin/inbound-mail/page.tsx:73-76 list control uses Read action instead of clickable row
- Fix: Ensure table rows keyboard-accessible and drawer focus return/escape working

## G2-13-024-045  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:110-114 paragraph explains every 42lms.com mail and conversation routing
- vNext now: src/app/(authenticated)/admin/inbound-mail/page.tsx:19 summary 'Private incoming messages. No automatic replies or outbound sends...'
- Fix: Restore exact intro paragraph under Inbound mail heading

## G2-10-009-009  [P3] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:111-114` introductory Paragraph secondary gray before controls
- vNext now: `src/app/(authenticated)/admin/inbound-mail/page.tsx:19` description in heading row, not separate paragraph
- Fix: Place exact paragraph under page title

## G2-10-009-010  [P3] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:12-17` OPEN segment label To read increments open count if >0
- vNext now: `src/app/(authenticated)/admin/inbound-mail/page.tsx:45-54` NEW tab count from data.toReadCount (including zero if returned)
- Fix: Match nonzero-only count badge and label text

## G2-10-009-031  [P3] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:106` segment OPEN count only if data.open truthy
- vNext now: `src/app/(authenticated)/admin/inbound-mail/page.tsx:46-55` toReadCount on To read tab
- Fix: Use legacy count omission for zero, if desired

## G2-10-009-037  [P3] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:51-57` defaults OPEN, q empty, page0, drawer closed, busy false
- vNext now: `src/app/(authenticated)/admin/inbound-mail/page.tsx:25` default NEW, q empty, page1; `src/components/admin/inbound-mail-list.tsx:17-21` drawer closed
- Fix: Map state defaults faithfully despite 0/1-based internal page difference

## G2-10-009-039  [P3] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:115-119` query only applied when Input.Search onSearch fires
- vNext now: `src/app/(authenticated)/admin/inbound-mail/page.tsx:56-60` submits form only on Filter
- Fix: Preserve explicit search-submit (not live typing) and clear behavior

## G2-10-009-092  [P3] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:117` Input.Search placeholder and allowClear; segments Ant component
- vNext now: `src/app/(authenticated)/admin/inbound-mail/page.tsx:49-59` custom Tabs and labeled Input
- Fix: Ensure segmented focus/aria-current matches legacy and visible search name

## G2-13-024-019  [P3] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:117-118 search placeholder 'Search sender, subject or text'
- vNext now: src/app/(authenticated)/admin/inbound-mail/page.tsx:57-59 placeholder 'Sender, subject or message body', maxLength120
- Fix: Restore search placeholder and verify 120-char new limit
