# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-7/u018-college-admin-deleted-workspaces.md

31 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u018-college-admin-deleted-workspaces.md

## G2-7-018-002  [P2] GAP  facet F01  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:161-169 title Deleted workspaces, subtitle Deleted workspaces you can still restore, Back to workspaces button
- vNext now: V/app/(authenticated)/college/projects/page.tsx:109-115 title Workspaces with Create workspace; no deleted-specific header
- Fix: Recreate deleted page heading/subtitle and Back link

## G2-7-018-003  [P2] GAP  facet F01  effort M
- Legacy: LFE/components/admin/AdminGroupShell.jsx:1-40 Projects group tab strip and admin guard on deleted page
- vNext now: V/components/projects/project-admin-nav.tsx:4-11 tabs Workspaces/At Risk/Readiness/Submissions/Templates/Audit, no Deleted tab
- Fix: Add reachable Deleted workspaces link from workspace tools with proper group context

## G2-7-018-007  [P2] GAP  facet F02  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:146-155 no college assigned Alert within shell
- vNext now: V/app/(authenticated)/college/projects/page.tsx:34-42 no college selected PageHeader/ErrorState
- Fix: Use legacy recoverable warning in Projects shell

## G2-7-018-010  [P2] GAP  facet F03  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:175 Card title Deleted workspaces
- vNext now: V/app/(authenticated)/college/projects/page.tsx:127-139 Archived workspaces tab and list toolbar
- Fix: Restore exact Card title

## G2-7-018-011  [P2] GAP  facet F03  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:166-168 Back to workspaces Button
- vNext now: V/app/(authenticated)/college/projects/page.tsx:109-115 Create workspace only
- Fix: Add Back button aligned top-right

## G2-7-018-013  [P2] GAP  facet F04  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:108-110 workspace name via normaliseCollegeScopedName fallback Workspace
- vNext now: V/app/(authenticated)/college/projects/page.tsx:92-98 displays project.title string
- Fix: Use title/name/projectTitle/templateTitle fallback chain

## G2-7-018-014  [P2] GAP  facet F04  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:113-118 mentor via projectMentorMember primary, fallback project.mentor, em dash
- vNext now: V/app/(authenticated)/college/projects/page.tsx:92-98 mentorName derived active snapshot, deleted members absent
- Fix: Select designated former mentor with safe fallback

## G2-7-018-017  [P2] MISSING  facet F05  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:106-137 columns Workspace, Mentor, Action in fixed order
- vNext now: V/app/(authenticated)/college/projects/page.tsx:127-145 Cards/List archived tab; deleted record columns absent
- Fix: Restore three-column table layout/order

## G2-7-018-018  [P2] GAP  facet F05  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:190-202 controlled server pagination 0-based pageNumber, size20 default
- vNext now: V/app/(authenticated)/college/projects/page.tsx:55-60 query page and pageSize for active/archived list only
- Fix: Use separate deleted list pagination state with zero-based API mapping

## G2-7-018-019  [P2] GAP  facet F05  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:193-200 page sizes 10/20/50/100 with selectable size
- vNext now: V/components/projects/project-admin-collection-controls.tsx:1-260 active list page size selector (not deleted)
- Fix: Add 10/20/50/100 deleted page sizes, default20

## G2-7-018-020  [P2] GAP  facet F05  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:195-196 total text `N-M of X deleted workspaces`
- vNext now: V/app/(authenticated)/college/projects/page.tsx:149-155 generic ProjectAdminPagination
- Fix: Use exact total-range copy

## G2-7-018-022  [P2] GAP  facet F05  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:185-186 stable row key id/slug/numericId fallback
- vNext now: V/modules/projects/instance-restore-service.ts:15-21 accepts UUID project ID, deleted list absent
- Fix: Use UUID row key and migration mapping from legacy slug

## G2-7-018-024  [P2] GAP  facet F06  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:131 restore button loading for exactly restoringId
- vNext now: V/components/projects/project-archive-control.tsx:23-26,60-79 single-page pending flag
- Fix: Use row-scoped loading and block same-row duplicate submits

## G2-7-018-034  [P2] GAP  facet F09  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:131-133 Restore icon UndoOutlined and primary button
- vNext now: V/components/projects/project-archive-control.tsx:84-86 Restore secondary button no icon
- Fix: Match icon, primary styling and placement

## G2-7-018-037  [P2] GAP  facet F10  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:97-99 successful restore refetches current page
- vNext now: V/components/projects/project-archive-control.tsx:70-72 refreshes detail, no collection refresh
- Fix: Refresh deleted table, totals and page adjustment after restore

## G2-7-018-044  [P2] GAP  facet F12  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:55-60 last page corrected if now empty and total>0
- vNext now: V/app/(authenticated)/college/projects/page.tsx:149-155 active collection generic pagination
- Fix: Apply page bound correction for deleted only

## G2-7-018-045  [P2] GAP  facet F13  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:175-183 six-row skeleton while fetching
- vNext now: V/app/(authenticated)/college/projects/page.tsx:71-87 server awaited snapshots; generic page loading component
- Fix: Use six-row deleted-list loading shell

## G2-7-018-046  [P2] GAP  facet F13  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:171-184 load failure Alert and Retry inside empty panel
- vNext now: V/app/(authenticated)/college/projects/page.tsx:79-86 Project workspaces unavailable retry link, not deleted-specific
- Fix: Restore precise retry/failed-load state

## G2-7-018-047  [P2] GAP  facet F13  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:203-205 No deleted workspaces for this college empty state only successful zero total
- vNext now: V/app/(authenticated)/college/projects/page.tsx:145-146 No Projects match these filters for live list
- Fix: Add exact deleted empty placeholder

## G2-7-018-048  [P2] GAP  facet F13  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:140-155 missing college warning inside project shell
- vNext now: V/app/(authenticated)/college/projects/page.tsx:34-42 No college selected ErrorState
- Fix: Match recoverable missing-college display

## G2-7-018-051  [P2] GAP  facet F15  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:87-95 mentorless restore may require admin reassignment later
- vNext now: V/modules/projects/instance-restore-service.ts:33-42 throws before project/member notifications if no mentor
- Fix: Warn administrator with follow-up action to assign mentor

## G2-7-018-052  [P2] GAP  facet F16  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:161-207 full-width Card and compact AntD Table, horizontal scrolling if narrow
- vNext now: V/app/(authenticated)/college/projects/page.tsx:127-155 Cards/List toggle
- Fix: Use single-column table/card and mobile responsive row actions

## G2-7-018-053  [P2] GAP  facet F16  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:166-169 Back action Space wrap when narrow
- vNext now: V/app/(authenticated)/college/projects/page.tsx:109-115 Create link button responsive
- Fix: Keep Back action wrapping at mobile widths

## G2-7-018-054  [P2] GAP  facet F17  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:125-134 Popconfirm keyboard confirm/cancel and row-level Undo icon
- vNext now: V/components/projects/project-archive-control.tsx:87-102 accessible Dialog on detail only
- Fix: Use focus-safe per-row Restore confirmation with keyboard route

## G2-7-018-055  [P2] MISSING  facet F17  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:185-201 Table column headers Workspace/Mentor/Action and pagination focus
- vNext now: V/app/(authenticated)/college/projects/page.tsx:127-155 no deleted semantic table headers
- Fix: Add accessible table header cells and labelled paging

## G2-7-018-056  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:163-168 Deleted workspaces, Deleted workspaces you can still restore., Back to workspaces
- vNext now: V/app/(authenticated)/college/projects/page.tsx:109-115 Workspaces, Live projects..., Create workspace
- Fix: Restore page-head copy exactly

## G2-7-018-057  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:171-183 Deleted workspaces could not be loaded and Retry
- vNext now: V/app/(authenticated)/college/projects/page.tsx:80-85 Project workspaces unavailable and Retry loading workspaces
- Fix: Use deleted-specific error wording

## G2-7-018-058  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:203-205 No deleted workspaces for this college
- vNext now: V/app/(authenticated)/college/projects/page.tsx:145-146 No Projects match these filters
- Fix: Restore exact empty-state text

## G2-7-018-059  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:93-101 mentorless warning and success `Workspace restored`
- vNext now: V/components/projects/project-archive-control.tsx:70-75 only generic Workspace restored/failure
- Fix: Restore mentorless success warning wording

## G2-7-018-062  [P2] GAP  facet F20  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:55-60 empty last page steps back automatically
- vNext now: V/app/(authenticated)/college/projects/page.tsx:149-155 generic pagination but no restore reload
- Fix: Handle page count shrink after restore

## G2-7-018-004  [P3] GAP  facet F01  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:167 Back to workspaces navigates legacy `/college-admin/projects/workspaces`
- vNext now: V/app/(authenticated)/college/projects/workspaces/page.tsx:3-5 canonical `/college/projects`
- Fix: Point Back link to `/college/projects` preserving college scope
