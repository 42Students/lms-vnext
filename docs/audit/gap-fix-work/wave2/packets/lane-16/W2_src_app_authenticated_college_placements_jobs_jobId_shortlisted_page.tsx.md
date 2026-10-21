# Work packet (wave 2): edit src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx

27 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-shortlisted.md

## G2-9-014-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/shortlisted.js:34-52` — AdminLayout and JobsErrorBoundary wrap ModuleGroupGuard, DriveSubNav, and JobApplications shortlistedMode.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:15-44` — Dedicated page renders PageHeader and list; missing shared job workspace tabs.
- Fix: Render identical shared shell and job subnavigation for Shortlisted.

## G2-9-014-002  [P2] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/shortlisted.js:41-45` — Shortlisted explicitly keeps Applications tab selected; it is a subview, not fifth tab.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:41-44` — PageHeader Shortlisted plus Applications back link; no active tab.
- Fix: Restore Applications active tab and secondary Shortlisted context.

## G2-9-014-003  [P2] MISSING  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/placements/DriveSubNav.jsx:21-46` — Breadcrumb Drives -> job/company, returnTo safe in jobs subtree.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:41-44` — Only Applications link, no breadcrumbs and no returnTo.
- Fix: Add scoped breadcrumb/returnTo preservation.

## G2-9-014-006  [P2] MISSING  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1547-1581` — Job/company/location summary card then status totals strip.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:40-52` — PageHeader and Search form then N shortlisted, no summary card or funnel strip.
- Fix: Restore summary card with placement stage counts.

## G2-9-014-007  [P2] MISSING  facet F02  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1585-1640` — Assessment-link alert follows job summary when assessment tab active and link exists.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:40-57` — No job assessment URL banner or Copy button.
- Fix: Show conditional assessment link with copy feedback.

## G2-9-014-008  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1610-1723` — Applications title+count+export, status tabs, filter/search toolbar in sequence.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:40-59` — Shortlisted title, filter form, count, export, table; stage tabs absent.
- Fix: Recreate section order and status tabs.

## G2-9-014-011  [P2] MISSING  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1551-1574` — Job active/closed status badge and up to eight nonzero stage Statistic tiles.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:40-52` — No status badge or per-stage counters.
- Fix: Render badge and true full-drive stage counts.

## G2-9-014-012  [P2] MISSING  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1594-1606` — Assessment URL Copy icon and code-styled link.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:40-60` — Assessment link and Copy absent.
- Fix: Add Copy with link and feedback.

## G2-9-014-013  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1617-1630` — Export CSV button has DownloadOutlined, spinner, success/error handling.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:53-56` — Plain Export CSV anchor, no spinner or download success state.
- Fix: Use loading-aware export button.

## G2-9-014-015  [P2] MISSING  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1920-1923` — Dedicated Refresh button with ReloadOutlined.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:45-57` — Filter submit but no Refresh action.
- Fix: Expose refresh to reload latest candidate statuses.

## G2-9-014-022  [P2] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1547-1580` — Job jobTitle, companyName, location displayed beside lifecycle badge.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:41-44` — Only drive.title as subtitle.
- Fix: Add company/location/badge from drive overview.

## G2-9-014-029  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1610-1730` — Search debounced and shallow URL synced.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:45-51` — GET form submit, full navigation, no debounced search.
- Fix: Debounce and preserve query/page on filter edits.

## G2-9-014-031  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1650-1778` — Status/source/dept/program/batch searchable selects and search input.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:45-50` — Only Student search input maxLength100, Filter button.
- Fix: Implement dependent selector controls and status tabs.

## G2-9-014-035  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2004-2035` — Pagination pageSize changes and page selection independent.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:60-66` — Previous/Next only with q/page; no page size controls.
- Fix: Expose 10/20/50/100 page size and preserve selection.

## G2-9-014-064  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1530-1545` — Error warning with retry and dismiss.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:28-31` — Invalid query ErrorState, separate route loading; server throw has generic boundary.
- Fix: Add error retry with retained list results.

## G2-9-014-066  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2031-2040` — Empty filtered vs unfiltered copies and Clear filters conditional.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:57-59` — Empty always No shortlisted students and uses query.q only to choose clear/View applications.
- Fix: Use stage/status/filter-aware empty state and copy.

## G2-9-014-068  [P2] GAP  facet F14  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1617-1640` — Export trigger downloads CSV with button loading/success/error.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:53-56` — CSV anchor with cap 1000, no client-side progress.
- Fix: Restore explicit export lifecycle and browser download feedback.

## G2-9-014-070  [P2] GAP  facet F14  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1256-1430` — No file upload button in shortlisted main table; offer letter actions in detail modal.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:35-66` — No upload in page or detail modal.
- Fix: Expose offer-letter view/upload through applicant detail workflow.

## G2-9-014-074  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1256-1378` — Fixed left identity/right actions columns and horizontal scroll on narrow widths.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:35-59` — Small responsive DataTable with Student Roll Role only.
- Fix: Restore horizontal/sticky identity and actions, mobile prioritization.

## G2-9-014-076  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1260-1370` — Column sorter and table checkbox controls via Ant semantic components.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:35-59` — Noninteractive table, search input has associated label.
- Fix: Add accessible checkbox headers, sorting and row actions.

## G2-9-014-077  [P2] MISSING  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1900-2004` — Confirm/modals use Ant Modal focus management and destroyOnClose.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:40-66` — No confirmation or detail dialogs on shortlist route.
- Fix: Use shared focus-trapped Dialog and return-focus on close.

## G2-9-014-080  [P2] MISSING  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1818-1915` — Action copy Mark Passed, Mark Failed, Move to Offered, Mark Hired, Reject, Refresh.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:40-66` — No action labels.
- Fix: Replicate exact concise verbs in appropriate tab.

## G2-9-014-081  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1256-1299` — Column labels Learner Name, Email, College, Source, Current Status, Applied Date.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:35-39` — Student, Roll, Role.
- Fix: Restore legacy labels and order.

## G2-9-014-082  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2033-2040` — Empty No applications match these filters; Try another status, search, or cohort filter.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:58-59` — No shortlisted students match these filters.
- Fix: Use exact empty copy per filtered/unfiltered state.

## G2-9-014-091  [P2] MISSING  facet F21  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:237-247` — Screening detail loaded on demand per applicant, not with whole table.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:35-39` — Score/detail not fetched from shortlist path.
- Fix: Load screening detail lazily on drawer open.

## G2-9-014-020  [P3] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1270-1288` — Missing learner identity/email placeholders are '-'.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:35-38` — Name fallback Unnamed learner; roll can be null without explicit placeholder.
- Fix: Use legacy placeholders exactly.

## G2-9-014-092  [P3] MISSING  facet F21  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1535-1605` — Assessment link copy accesses navigator.clipboard asynchronously.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx:40-59` — No clipboard action.
- Fix: Use guarded clipboard and fallback notice.
