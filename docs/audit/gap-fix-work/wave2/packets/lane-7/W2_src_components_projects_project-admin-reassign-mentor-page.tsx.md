# Work packet (wave 2): edit src/components/projects/project-admin-reassign-mentor-page.tsx

19 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/superadmin-projects-workspaces-reassign-mentor.md, docs/audit/gap2/lane-7/u021-college-admin-mentor-reassignment.md

## G2-6-028-001  [P2] GAP  facet F01  effort M
- Legacy: Super Admin route /superadmin/projects/workspaces/reassign-mentor; wraps SuperAdminLayout, SuperAdminGroupShell groupKey=projects (reassign-mentor.js:26-29,355-358,513-518).
- vNext now: Unified admin route /admin/projects/reassign-mentor with ProjectAdminNav, page wrapper (admin/projects/reassign-mentor/page.tsx:10-23,54-61; project-admin-reassign-mentor-page.tsx:71-79).
- Fix: Keep legacy Super Admin projects tab activation, back-link placement, and navigation path via mapped redirects.

## G2-6-028-016  [P2] GAP  facet F05  effort S
- Legacy: Legacy workload table Active workspaces default descending and numeric sorter (reassign-mentor.js:170-185).
- vNext now: vNext workload aggregation returns DB unsorted and maps in result order; Link tiles (mentor-reassignment-workload-service.ts:80-94; project-admin-reassign-mentor-page.tsx:79-95).
- Fix: Order active count descending with stable name tie-break; expose sorted table header.

## G2-7-021-004  [P2] GAP  facet F01  effort S
- Legacy: reassign-mentor.js:364-370 title Bulk mentor reassignment, subtitle Move multiple active workspaces to a new mentor at once
- vNext now: project-admin-reassign-mentor-page.tsx:74-76 same title, subtitle Move selected non-archived project workspaces to a new primary mentor
- Fix: Match page subtitle verbatim

## G2-7-021-005  [P2] GAP  facet F02  effort S
- Legacy: reassign-mentor.js:378-392 first Card Mentor workload always expanded
- vNext now: project-admin-reassign-mentor-page.tsx:79-95 Mentor workload Disclosure collapsed by default
- Fix: Show workload expanded above filters on entry

## G2-7-021-006  [P2] GAP  facet F02  effort M
- Legacy: reassign-mentor.js:394-412 Card Filter by current mentor
- vNext now: project-admin-reassign-mentor-page.tsx:96-132 generic Filters Disclosure with three forms
- Fix: Show immediate standalone current-mentor filter ahead of selection

## G2-7-021-009  [P2] GAP  facet F02  effort M
- Legacy: reassign-mentor.js:362-376 page header followed by loading Error Alert and cards
- vNext now: project-admin-reassign-mentor-page.tsx:36-65 full-page ErrorState on any dependency error
- Fix: Show inline retry banner without dropping page navigation

## G2-7-021-010  [P2] GAP  facet F03  effort M
- Legacy: reassign-mentor.js:164-206 Mentor workload table with tooltip question icon and orange Overloaded
- vNext now: project-admin-reassign-mentor-page.tsx:79-95 linked rows with StatusBadge but no tooltip
- Fix: Render workload table and original tooltip/explanation

## G2-7-021-012  [P2] GAP  facet F03  effort M
- Legacy: reassign-mentor.js:395-409 searchable Current mentor picker placeholder Any mentor — search by name
- vNext now: project-admin-reassign-mentor-page.tsx:113-131 static picker plus Apply mentor filter
- Fix: Use searchable picker applying immediately

## G2-7-021-019  [P2] GAP  facet F04  effort S
- Legacy: reassign-mentor.js:180-205 Active workspaces tooltip and At-risk column
- vNext now: project-admin-reassign-mentor-page.tsx:87-92 active count and at-risk labels rendered in cards
- Fix: Restore workload numeric columns, tagged counts and tooltip

## G2-7-021-022  [P2] GAP  facet F05  effort M
- Legacy: reassign-mentor.js:164-206 workload table sorted count descending with clickable Mentor column
- vNext now: project-admin-reassign-mentor-page.tsx:79-95 workload rows unsorted in rendering and collapse
- Fix: Sort descending and retain clickable mentor name

## G2-7-021-023  [P2] GAP  facet F05  effort M
- Legacy: reassign-mentor.js:381-386 workload table pageSize10 only when over10
- vNext now: project-admin-reassign-mentor-page.tsx:79-95 all workload rows no pagination
- Fix: Use compact ten-row pagination for large colleges

## G2-7-021-029  [P2] GAP  facet F06  effort M
- Legacy: reassign-mentor.js:395-409 searchable optional from mentor and clear
- vNext now: project-admin-reassign-mentor-page.tsx:113-131 dropdown requiring Apply, includes UNASSIGNED
- Fix: Search and apply immediately, support clear

## G2-7-021-060  [P2] GAP  facet F13  effort M
- Legacy: reassign-mentor.js:378-391 Skeleton four rows for workload and :419-432 six for table
- vNext now: project-admin-reassign-mentor-page.tsx:51-65 async server fetch, no skeleton in component
- Fix: Add equivalent loading skeletons for navigation/refetch

## G2-7-021-061  [P2] GAP  facet F13  effort S
- Legacy: reassign-mentor.js:388-389 No project workspaces available for this college
- vNext now: project-admin-reassign-mentor-page.tsx:79-95 workload Disclosure empty blank
- Fix: Restore exact empty workload message

## G2-7-021-063  [P2] GAP  facet F13  effort M
- Legacy: reassign-mentor.js:374-375 inline retry retains page structure
- vNext now: project-admin-reassign-mentor-page.tsx:56-65 full-screen error state
- Fix: Keep Back/navigation, filters and retry after load failure

## G2-7-021-069  [P2] GAP  facet F16  effort M
- Legacy: reassign-mentor.js:367-370 head actions Space wrap and :395-409 picker minWidth240
- vNext now: project-admin-reassign-mentor-page.tsx:73-132 responsive grid, collapsed filters
- Fix: Match stacked/wrapped action and visible picker at 375,768,1280

## G2-7-021-074  [P2] GAP  facet F18  effort S
- Legacy: reassign-mentor.js:365 Move multiple active workspaces to a new mentor at once
- vNext now: project-admin-reassign-mentor-page.tsx:76 Move selected non-archived project workspaces...
- Fix: Match subtitle copy verbatim

## G2-7-021-075  [P2] GAP  facet F18  effort S
- Legacy: reassign-mentor.js:394 Filter by current mentor / :396 Current mentor
- vNext now: project-admin-reassign-mentor-page.tsx:96 Filters Disclosure then :117 Filter by current mentor
- Fix: Restore section header and field label

## G2-7-021-079  [P2] GAP  facet F18  effort S
- Legacy: reassign-mentor.js:434 Mentor options could not be loaded / Retry mentors
- vNext now: project-admin-reassign-mentor-page.tsx:61-65 Mentor reassignment unavailable / Retry loading mentor reassignment
- Fix: Keep dedicated options error copy
