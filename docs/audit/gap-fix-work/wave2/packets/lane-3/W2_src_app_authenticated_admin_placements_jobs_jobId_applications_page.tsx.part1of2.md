# Work packet (wave 2): edit src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-applications.md, docs/audit/gap2/lane-10/superadmin-jobs-jobid-shortlisted.md, docs/audit/gap2/lane-8/l11-u030-superadmin-job-applications.md

## G2-10-011-002  [P2] MISSING  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/placements/DriveSubNav.jsx:6-11,49-59 — Breadcrumb Drives › Drive #ID/name and level-2 tabs Overview / Applications / Schedule / Settings.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:48-50 — Only PageHeader Applications · title and one Drive overview link; no four-tab strip or breadcrumb.
- Fix: Render exact breadcrumb and four tab labels with Applications selected, correct URLs.

## G2-10-011-003  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/placements/DriveSubNav.jsx:23-31 — Sanitizes returnTo and maintains source Jobs route when switching drive tabs.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:20-21,48-50 — Hard-coded overview URL, no returnTo propagation.
- Fix: Pass safe returnTo into all workspace links and preserve filter source on back.

## G2-10-011-004  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1498-1514 — Back to Jobs on Super Admin navigates /superadmin?selectedKey=jobs.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:48-50 — Drive overview link, not Back to Jobs.
- Fix: Restore an explicit Back to Jobs target preserving Super Admin Jobs selection.

## G2-10-011-005  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/applications.js:18-29 — No selected scope shows warning 'Select a college to continue' plus Organization + College instruction.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:27-31 — Shows PageHeader Drives and EmptyState 'Choose a college'.
- Fix: Match warning icon, title and exact scope guidance inside existing module canvas.

## G2-10-011-006  [P2] MISSING  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/applications.js:31-45; docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1498-1615 — Drive navigation then Back to Jobs, job summary card, status counters, optional assessment banner.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:46-50 — Page header then filter form, stage tabs; no job summary card, counters or assessment banner.
- Fix: Recreate legacy section sequence and job summary, preserving new data services.

## G2-10-011-007  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1613-1615,1912-1915,1990-2038 — Applications (N) heading, Refresh button, then horizontal Ant table (no filter bar for this Super Admin mode).
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:51-115,116-131 — Filters, tabs, export, pipeline toolbar, table and pagination in different order.
- Fix: Place legacy heading and refresh above table; distinguish Super Admin from College Admin toolbar.

## G2-10-011-009  [P2] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1547-1577 — Company/location label, active/closed status badge, per-status Statistic metrics rendered on job card.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:48-50,105-110 — Only title and global stage tab counts; no company/location/job active indicator.
- Fix: Add job/company/location/active indicator and same statistic tiles in legacy order.

## G2-10-011-012  [P2] MISSING  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1912-1915 — Refresh button carries ReloadOutlined icon and loading spinner.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:46-137 — No refresh button; page refresh via browser/navigation only.
- Fix: Add Refresh control that reloads scoped data with busy indication.

## G2-10-011-019  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1994-2020 — Super Admin uses 10-row client pagination with size options 10/25/50/100; all job apps fetched first.
- vNext now: src/modules/placements/college-drive-applications-model.ts:12-17; src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:128-131 — Server pagination fixed at 25; no page-size control.
- Fix: Restore legacy 10-per-page default and page-size chooser where safe; keep server paging for scale.

## G2-10-011-052  [P2] GAP  facet F11  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/applications.js:18-29 — Missing college gives actionable warning instead of render error.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:27-31 — Choose a college empty state but no Organization + College instruction.
- Fix: Restore exact instruction and icon while preserving fail-closed action access.

## G2-10-011-061  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1457-1480 — Missing/inaccessible college error with Go to Superadmin recovery action.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:27-31 — Choose a college empty state; no equivalent Go to Superadmin action.
- Fix: Restore exact scoped recovery navigation.

## G2-10-011-072  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1613-1615 — Exact heading 'Applications (N)'.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:48-50 — 'Applications · {drive.title}' and subtitle about notifying candidates.
- Fix: Match legacy heading count placement and capitalization.

## G2-10-011-074  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/applications.js:21-25 — Exact warning 'Select a college to continue' with 'Applications is college-scoped. Pick an Organization + College in the header above.'.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:28-31 — 'Choose a college' and different helper text.
- Fix: Copy exact message strings from source and legacy-copy-B.

## G2-10-011-076  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:503-511 — Re-fetches applications on window focus to reconcile remote admin changes.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:42-45; src/components/placements/college-application-pipeline-controls.tsx:64-79 — Server load and router.refresh after mutations, no visible focus refetch.
- Fix: Add focus revalidation or documented freshness banner without showing stale stages.

## G2-10-015-001  [P2] MISSING  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/shortlisted.js:33-47; docs/legacy-source/frontend/src/components/admin/placements/DriveSubNav.jsx:6-11 — Uses DriveSubNav with active Applications, not a fifth Shortlisted tab.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:48-50 — No Shortlisted route; admin Applications page has PageHeader and no four-tab drive nav.
- Fix: Restore applications tab strip in shortlist subview.

## G2-10-015-003  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/shortlisted.js:19-30 — Missing selected college: warning 'Select a college to continue' and explicit Organization + College instruction.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:27-31 — Choose a college EmptyState, different text.
- Fix: Match warning message and styling.

## G2-10-015-004  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/shortlisted.js:34-38 — JobsErrorBoundary back to /superadmin/jobs, scoped shell.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:42-50 — Generic error route and Drive overview link.
- Fix: Retain back target and error recovery.

## G2-10-015-005  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/shortlisted.js:35-47; docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1613-1693 — Tabs/breadcrumb above Applications (N), export and shortlist 4-step segmented status strip.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:48-115 — PageHeader then filters, 10-stage tabs, count/export toolbar.
- Fix: Restore ordering and highlighted 4-stage strip.

## G2-10-015-006  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1696-1813 — Search, status, source, academic cascades in light-gray bordered Ant filter card.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:51-104 — Native GET form with accordion, different fields/spacing.
- Fix: Match strip borders, layout, and filter labels.

## G2-10-015-009  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1658-1693 — Segmented control #f5f5f5 bg, #f0f0f0 border, 8px radius, 3px pad, 2px gap.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:105-110 — Generic Tabs with many stages, theme styling.
- Fix: Apply legacy segmented visual exactly.

## G2-10-015-010  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1668-1676 — Only Assessment, Interview, Waitlisted, Offered buttons; active primary filled, other text.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:105-110 — All/Applied/Shortlisted/Assessment/Interview/Waitlisted/Offered/Hired/Rejected/Withdrawn.
- Fix: Limit shortlist subview to 4 correct labels/order.

## G2-10-015-013  [P2] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1912-1914 — Refresh reload icon, visible loading indicator.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:48-137 — No refresh CTA on page.
- Fix: Add Refresh and busy state.

## G2-10-015-022  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:417-439 — Search uses 400ms debounce, auto-updates URL, resets page.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:51-105 — Search only on Filter submit.
- Fix: Implement debounce and URL-synced changes.

## G2-10-015-024  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1994-2020 — 20/page, options 10,20,50,100, client restores chosen size.
- vNext now: src/modules/placements/college-drive-applications-model.ts:12-17; src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:128-131 — Hardcoded 25/page with no size changer.
- Fix: Expose page size choices, reset page on switch.

## G2-10-015-028  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1621-1655 — Export CSV download named applications-job-${jobId}.csv, Ant toast on success/error.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:111-115 — Native export direct URL, capped at 1,000, no download toast.
- Fix: Match file naming and indicate cap/truncation.

## G2-10-015-045  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:706-739 — Legacy filtered CSV endpoint honors selected stage status and filters.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:111-115 — New export cap1000 stage-based query; filename/truncation differs.
- Fix: Keep filtered status semantics, warn on truncation.

## G2-10-015-054  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1449-1480 — Missing college/job errors and dashboard skeleton with scoped recovery.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:27-45 — Choose-college EmptyState or server loading boundary.
- Fix: Restore warning/skeleton geometry.

## G2-10-015-058  [P2] GAP  facet F14  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1621-1655 — Button Export CSV triggers named download, no fixed 1000 cap in UI.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:111-115 — Capped 1000 export with formula-neutralized fields/truncation note.
- Fix: Preserve data selection and show cap without surprising missing rows.

## G2-10-015-065  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1658-1693 — Four mini status buttons wrap with 2px gaps and padding3.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:105-110 — 10 Tabs wrap/overflow differently.
- Fix: Match original 4-stage strip at 320/375/768 widths.

## G2-10-015-066  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1696-1784 — Light gray filter panel wraps status/source/hierarchy controls.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:51-104 — GET form with accordion and 1/2/3 column grid.
- Fix: Copy spacing and visible control ordering.

## G2-10-015-070  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/shortlisted.js:19-30 — Exact 'Shortlisted is college-scoped. Pick an Organization + College in the header above.'
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:27-31 — Generic selected college instruction.
- Fix: Copy exact message.

## G2-10-015-072  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1668-1677 — Exactly Assessment/Interview/Waitlisted/Offered in that order.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:105-110 — 10 stage labels and All.
- Fix: Match shortlist copy and order.

## G2-10-015-073  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1912-1914 — Refresh and Applications (N) heading.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:116-131 — Matching applications count and no Refresh.
- Fix: Match headings and actions.

## G2-10-015-088  [P2] GAP  facet F23  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/shortlisted.js:41-45 — Applications tab stays selected in Shortlisted subroute by design.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:48-50 — No parent tabs; generic page.
- Fix: Avoid inventing separate Shortlisted tab.

## G2-11-030-001  [P2] GAP  facet F01  effort M
- Legacy: 58-63 /superadmin/jobs/{jobId}/applications supports college-scoped and shortlistedMode
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:23-39 uses /admin/placements/jobs/{UUID}/applications, separate platform-wide index src/app/(authenticated)/admin/placements/applications/page.tsx:7-16
- Fix: Restore legacy deep link and shortlisted flag mapping.

## G2-11-030-002  [P2] GAP  facet F01  effort S
- Legacy: 1451-1516 back link to Jobs or Dashboard, display scoped job name
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:52-57 PageHeader Applications · job title with Drive overview action
- Fix: Match old Back to Jobs and title structure.

## G2-11-030-003  [P2] GAP  facet F02  effort M
- Legacy: 1547-1615 status metric tiles then Apps header and filter panel
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:59-114 filter panel and tabs first, no metric card grid
- Fix: Add legacy count tiles above table and matching vertical rhythm.

## G2-11-030-004  [P2] GAP  facet F02  effort M
- Legacy: 1992-2033 AntD Table with 10-row skeleton and horizontal scroll
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:118-132 DataTable and pipeline component with border layout
- Fix: Match header heights, row density and scroll surface.

## G2-11-030-005  [P2] GAP  facet F03  effort S
- Legacy: 939-958 colored application status config Tag components
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:120-131 StatusBadge and 10 pipeline tabs, labels may differ
- Fix: Map old badges and status text exactly.

## G2-11-030-006  [P2] GAP  facet F03  effort S
- Legacy: 1617-1670 CSV and bulk actions in header toolbar
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:110-115 export link and controls below stage tabs
- Fix: Restore toolbar ordering and icon button affordances.
