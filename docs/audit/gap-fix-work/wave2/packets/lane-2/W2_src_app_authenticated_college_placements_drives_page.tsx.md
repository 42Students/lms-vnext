# Work packet (wave 2): edit src/app/(authenticated)/college/placements/drives/page.tsx

37 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-all.md

## G2-9-015-001  [P2] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/all.js:10-13` — All jobs /college-admin/jobs/all is secondary view reached by All drives from card landing.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:17-29` — VNext /college/placements/drives is primary list route with backlink Operations workspace.
- Fix: Expose All drives escape hatch from landing and preserve exact labels/routes.

## G2-9-015-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/all.js:23-44` — Sets Redux active menu jobs, wraps AdminLayout JobsErrorBoundary AdminGroupShell placements.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:17-28` — Server app route PageHeader/permissions, no explicit legacy shell/menu active wiring.
- Fix: Match sidebar active state and placements grouped tab shell.

## G2-9-015-004  [P2] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:302-312` — Applications drilldown under /college-admin/jobs/{id}/applications with safe returnTo.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:44-47` — Link to /college/placements/jobs/{uuid}/applications, no returnTo.
- Fix: Preserve filter+pagination returnTo during drilldown.

## G2-9-015-005  [P2] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:670-687` — College scoped title Jobs; non-college fallback Jobs Management (LMS).
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:54-57` — PageHeader title Drives, desc College-owned placement drives.
- Fix: Use Jobs title for legacy flat list while maintaining placement identity.

## G2-9-015-010  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:809-834` — Error/warning and RefreshStatus above responsive desktop/mobile listings.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:22-28` — Filter parse error only; async reads on server, no scoped refresh indicator.
- Fix: Surface preserved-last-results and retry on data-fetch failure.

## G2-9-015-011  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:829-870` — Desktop table then mobile stacked drive cards and mobile pagination.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:109-124` — One generic DataTable and text pagination.
- Fix: Match distinct compact desktop vs mobile card composition.

## G2-9-015-012  [P2] MISSING  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:875-906` — Edit Job/Create Job 800px Modal at end of page.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:44-50` — Edit link navigates away, no modal.
- Fix: Restore modal with JobForm + discard guard.

## G2-9-015-014  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:698-711` — Input.Search with allowClear, placeholder Search by job title or company, width260.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:58-62` — Input search label Title or company; no placeholder/clear icon.
- Fix: Use exact placeholder, clear affordance and control width.

## G2-9-015-017  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:491-513` — StatusBadge Draft/Open/Closed and Open · Expired if deadline passed.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:30-43` — Status column literal Live/Draft/Closed/Archived, expiry not marked.
- Fix: Expose Open · Expired status label based on deadline.

## G2-9-015-018  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:551-608` — View Applications (eye), Edit (pencil), Close/Open, Delete red trash.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:43-50` — Plain View applications/Edit links, lifecycle component, deadline action; delete absent.
- Fix: Clone icon, order and delete/archival action with accurate labels.

## G2-9-015-020  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:487-541` — Deadline calendar icon orange when expired, line-through expired text.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:39-39` — Plain formatted date, no icon or line-through.
- Fix: Restore calendar icon and expired strike style.

## G2-9-015-021  [P2] MISSING  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:822-834` — RefreshStatus says Refreshing drives… and warning Couldn't refresh drives.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:109-117` — Only query-driven server render; no explicit refresh state.
- Fix: Add refresh/failed-refresh status UI.

## G2-9-015-022  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:501-541` — Job Title cell contains status badge, bold title and gray company subtitle.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:31-36` — Drive title with Open drive link; company separate column.
- Fix: Combine title/company/status as legacy first cell.

## G2-9-015-025  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:532-552` — Deadline uses DD MMM YYYY, missing em dash, expired line-through.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:39-39` — Intl en-IN medium with IST, missing Not specified.
- Fix: Match date text/fallback and expiry decoration.

## G2-9-015-026  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:555-564` — Posted uses postedDate or createdAt, DD MMM YYYY, missing em dash.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:40-40` — PublishedAt only; fallback Not posted.
- Fix: Use postedDate/createdAt fallback and legacy text.

## G2-9-015-030  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:614-665` — Mobile card includes title, company, location, deadline, status and action row.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:30-52` — Mobile adapts DataTable columns; no dedicated card.
- Fix: Build responsive cards with exact mobile field order.

## G2-9-015-031  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:497-610` — Columns Job Title,Type,Location,Deadline,Posted,Applicants,Actions; no separate Company/Status.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:30-52` — Columns Drive,Company,Type,Location,Deadline,Posted,Applicants,Status,Actions.
- Fix: Restore seven-column legacy order; embed company/status into title.

## G2-9-015-034  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:118-138` — 400ms debounced search, shallow replace, no page reset on Back.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:58-63` — GET form submit, no debounce and full nav.
- Fix: Restore debounced search and back behavior.

## G2-9-015-035  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:702-717` — Status All,Draft,Active,Closed.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:63-66` — Status dropdown Live,Draft,Closed,Archived,All.
- Fix: Match option order and Active wording.

## G2-9-015-037  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:831-856` — Ant table sort/server total, dynamic 10/20/50/100.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:110-124` — DataTable 25 fixed with prev/next, no size changer or range.
- Fix: Add page size/range matching Ant UI.

## G2-9-015-038  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:548-610` — Row actions fixed right, View Applications Edit Close/Open Delete.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:43-50` — Row actions wrapping links and separate lifecycle/deadline controls.
- Fix: Restore order and fixed action column.

## G2-9-015-039  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:170-203` — No filters means No drives yet; otherwise No drives match these filters with clear/create action.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:114-117` — No drives match these filters in this college even on pristine empty view.
- Fix: Distinguish empty first-use vs no matching filters; Create drive CTA.

## G2-9-015-043  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:708-718` — Status filter default all, change resets selection and page.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:63-67` — Default PUBLISHED, GET filter submit only.
- Fix: Use all default, reset selection/page on change.

## G2-9-015-058  [P2] MISSING  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:875-903` — Create Job/Edit Job modal width800, destroyOnClose.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:43-47` — Navigation to settings, no modal.
- Fix: Create 800px accessible modal and focus restore.

## G2-9-015-071  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:204-227` — Stale abort controller, loadedScopeKey and errorScopeKey separate stale-state per college/filter.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:20-28` — Server render through listCollegeDrives, no stale listing fallback.
- Fix: Add refresh recovery while enforcing tenant-safe cache key.

## G2-9-015-072  [P2] MISSING  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:828-850` — Desktop TableSkeleton rows10 columns8; mobile CardGridSkeleton 4 cards.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:17-28` — No route-specific skeleton shown here.
- Fix: Implement matching table and card load skeleton.

## G2-9-015-079  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:614-667` — Dedicated mobile job card with company, status, buttons, and simple Pagination.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:30-51` — DataTable responsive but many columns/actions hidden or relocated.
- Fix: Recreate legacy compact mobile card with equal reachability.

## G2-9-015-080  [P2] GAP  facet F16  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:830-856` — Desktop table horizontal scroll x max-content and fixed action right.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:30-52` — Generic responsive DataTable, no fixed-right action.
- Fix: Restore sticky action/identity on wide mobile table.

## G2-9-015-082  [P2] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:547-608` — Action buttons have individual aria-label with full jobTitle, e.g. Delete job X.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:44-47` — Link text View applications/Edit, no per-row aria-label.
- Fix: Add action aria-label linked to row title.

## G2-9-015-084  [P2] MISSING  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:885-897` — Modal destroyOnClose clears state, Dialog semantics.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:43-47` — No Create/Edit dialog.
- Fix: Add focus-managed create/edit dialog and reset on close.

## G2-9-015-085  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:676-711` — Heading Jobs; button Create Job; search placeholder Search by job title or company.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:55-62` — Heading Drives, no create, label Title or company.
- Fix: Clone exact heading/CTA/placeholder.

## G2-9-015-086  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:702-717` — Status All, Draft, Active, Closed.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:63-67` — Status Live, Draft, Closed, Archived, All.
- Fix: Map labels and ordering in legacy vocabulary.

## G2-9-015-087  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:482-491` — Status labels Open, Closed, Draft, Open · Expired.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:41-42` — Status Live, Closed, Draft, Archived.
- Fix: Display Open, preserve archived as additional state.

## G2-9-015-089  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:170-190` — Empty text No drives yet vs No drives match these filters.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:114-115` — No drives match these filters in this college for all empties.
- Fix: Restore exact heading/body depending filters.

## G2-9-015-091  [P2] GAP  facet F19  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:118-137` — 400ms search debounce avoids per-keystroke refetch.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:58-63` — GET form only, no debounce.
- Fix: Use debounced query update, preserve selected status.

## G2-9-015-024  [P3] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:526-531` — Location fallback '-' (dash).
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:38-38` — Location fallback Not specified.
- Fix: Use dash for missing Location.

## G2-9-015-088  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:549-608` — Button View Applications in title case.
- vNext now: `src/app/(authenticated)/college/placements/drives/page.tsx:44-45` — View applications lower-case applications.
- Fix: Use View Applications capitalization.
