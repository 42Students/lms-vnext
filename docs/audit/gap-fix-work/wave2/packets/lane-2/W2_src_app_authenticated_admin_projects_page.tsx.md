# Work packet (wave 2): edit src/app/(authenticated)/admin/projects/page.tsx

39 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/cross-10-list-conventions.md, docs/audit/gap2/lane-10/superadmin-projects-workspaces.md, docs/audit/gap2/lane-2/admin-project-controller.md, docs/audit/gap2/lane-3/l11-u028-superadmin-deleted-workspaces.md, docs/audit/gap2/lane-5/u028-superadmin-projects-section.md, docs/audit/gap2/lane-8/l12-u028-superadmin-project-team.md

## G2-10-031-036  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:672-677 — college gate warns Select a College to manage Jobs.
- vNext now: src/app/(authenticated)/admin/projects/page.tsx:51-69 — generic no scope EmptyState for project list.
- Fix: Preserve admin warning state for scoped pages.

## G2-10-028-001  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:345-350 — route /superadmin/projects/workspaces h1 Project workspaces.
- vNext now: src/app/(authenticated)/admin/projects/page.tsx:135-138 — /admin/projects h1 Workspaces.
- Fix: Restore full legacy h1.

## G2-10-028-004  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:328-339 — no-college message retains grouped Projects navigation.
- vNext now: src/app/(authenticated)/admin/projects/page.tsx:51-69; src/components/projects/project-admin-nav.tsx:26-29 — EmptyState, nav suppressed.
- Fix: Preserve group tabs in no-college state.

## G2-10-028-005  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:347-375 — header actions followed by Workspaces card.
- vNext now: src/app/(authenticated)/admin/projects/page.tsx:135-169 — header, dropdown, new view tabs, filters and list toolbar.
- Fix: Restore section order and visual hierarchy.

## G2-10-028-006  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:375-399,440-446 — table+filters enclosed in one Workspaces card.
- vNext now: src/app/(authenticated)/admin/projects/page.tsx:163-189 — separate FilterBar/ListToolbar/list without Workspaces Card.
- Fix: Render legacy contiguous card area.

## G2-10-028-010  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:375-387 — Workspaces card title.
- vNext now: src/app/(authenticated)/admin/projects/page.tsx:163-169 — toolbar without Workspaces card title.
- Fix: Restore card caption.

## G2-10-028-033  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:136-170 and docs/legacy-source/frontend/src/api/Services/AdminService.js:377-380 — GET /api/v1/admin/projects/page?collegeId,status,search,page,size.
- vNext now: src/app/(authenticated)/admin/projects/page.tsx:104-111 and src/modules/projects/admin-insights-service.ts:86-160 — direct database service with scoped query.
- Fix: Reproduce old status/search/default/response semantics.

## G2-10-028-036  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:322-341 — scopeLoaded skeleton or warning, both inside shell.
- vNext now: src/app/(authenticated)/admin/projects/page.tsx:51-69 — empty state without scope-load UI.
- Fix: Add source scope loading state.

## G2-10-028-039  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:41-45,440-452 — Skeleton only initial; later table overlay retains rows.
- vNext now: src/app/(authenticated)/admin/projects/page.tsx:104-130; src/app/(authenticated)/admin/projects/loading.tsx:3-6 — SSR fallback/replacement.
- Fix: Keep previous rows on filter refetch.

## G2-10-028-040  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:463-466 — filtered and unfiltered empty text differ.
- vNext now: src/app/(authenticated)/admin/projects/page.tsx:186-189 — one No Projects match these filters message.
- Fix: Restore two empty-state cases.

## G2-10-028-041  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:370-374 — retry alert above Workspaces card.
- vNext now: src/app/(authenticated)/admin/projects/page.tsx:120-130 — ErrorState replaces filter/action controls.
- Fix: Keep scoped filters visible on failure.

## G2-10-028-048  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:349-361 — exact title/actions Project workspaces, Create workspace, Bulk reassign mentor, Deleted workspaces.
- vNext now: src/app/(authenticated)/admin/projects/page.tsx:137-151 — title shortened, two actions nested, Deleted absent.
- Fix: Restore literal copy/action placement.

## G2-10-028-050  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:136-186 — guarded 350ms async debounce.
- vNext now: src/app/(authenticated)/admin/projects/page.tsx:104-111 — SSR fetch only after form submission.
- Fix: Add debounce and stale-request safety.

## G2-2-020-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy frontend superadmin/projects/workspaces/index.js:204-293 AntD table with action column
- vNext now: src/app/(authenticated)/admin/projects/page.tsx:1-22 list component with cards/table
- Fix: Default and align to old table columns/geometry/row actions.

## G2-2-020-017  [P2] GAP  facet F05  effort M
- Legacy: AdminProjectController.java:306-313 page 0-based, size default25
- vNext now: src/app/(authenticated)/admin/projects/page.tsx:68-75 page 1-based, size default20
- Fix: Match old default25 and map page index for bookmarks.

## G2-2-020-047  [P2] GAP  facet F13  effort M
- Legacy: Legacy workspaces/index.js:126-174 keeps old rows visible on refresh error
- vNext now: src/app/(authenticated)/admin/projects/page.tsx:94-115 server render ErrorState
- Fix: Retain stale rows with guarded actions during transient read failures.

## G2-11-028-003  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:145-180`
- vNext now: `src/app/(authenticated)/admin/projects/page.tsx:137-155`
- Fix: Legacy Deleted workspaces heading/subtitle and Back to workspaces; vNext archived records are shown inside generic Workspaces directory via filter.

## G2-11-028-004  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:145-167`
- vNext now: `src/app/(authenticated)/admin/projects/page.tsx:137-167`
- Fix: Legacy SuperAdminGroupShell and admin-list-page header then single bordered Deleted workspaces Card; vNext ProjectAdminNav, tabs, filters and workspace list without dedicated recoverable-delete card.

## G2-11-028-014  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:29-31`
- vNext now: `src/app/(authenticated)/admin/projects/page.tsx:84-98`
- Fix: Legacy stores pageNumber 0-based and 20 page size; vNext list uses 1-based page, default query pageSize25 with legacy form select 20 option.

## G2-11-028-044  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:133-143`
- vNext now: `src/app/(authenticated)/admin/projects/page.tsx:49-68`
- Fix: Legacy missing scope has skeleton before scopeLoaded and warning after; vNext server page directly returns No college selected and tabs.

## G2-11-028-045  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:158-163`
- vNext now: `src/app/(authenticated)/admin/projects/page.tsx:121-128`
- Fix: Legacy partial load failure shows error Alert and Retry Empty rather than success empty; vNext generic workspace failure prevents misleading empty but does not specifically retry deleted list.

## G2-11-028-047  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:164-166`
- vNext now: `src/app/(authenticated)/admin/projects/page.tsx:102-110`
- Fix: Legacy deleted-row fetch Skeleton six rows; vNext SSR suspense/error route boundary; compare loading state live.

## G2-11-028-056  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:150-166`
- vNext now: `src/app/(authenticated)/admin/projects/page.tsx:137-155`
- Fix: Legacy Deleted workspaces heading, Deleted workspaces you can still restore. and Back to workspaces are missing.

## G2-11-028-064  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:51-56`
- vNext now: `src/app/(authenticated)/admin/projects/page.tsx:191-201`
- Fix: Legacy page auto-clamps last page when restore removes final row; vNext refresh may leave Page out of range and empty list until user navigates.

## G2-11-028-072  [P2] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:353-361`
- vNext now: `src/app/(authenticated)/admin/projects/page.tsx:146-150`
- Fix: Legacy Deleted workspaces navigation link omitted from vNext main projects actions.

## G2-5-028-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy scoped Super Admin Projects section, title Projects, subtitle about student/mentor workspaces. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:55-65,592-618`
- vNext now: vNext directs to `/admin/projects`, header `Workspaces`, back link and ProjectAdminNav. `src/app/(authenticated)/admin/projects/page.tsx:31-60,135-153`
- Fix: Restore Projects page head/description and section entry hierarchy.

## G2-5-028-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy top actions Refresh and Create Project. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:610-617`
- vNext now: vNext CreateProjectControl and More dropdown, no explicit top Refresh button. `src/app/(authenticated)/admin/projects/page.tsx:139-153`, `src/components/projects/project-create-control.tsx:214-225`
- Fix: Add Refresh preserving list filters and new Create action.

## G2-5-028-003  [P2] GAP  facet F01  effort M
- Legacy: Legacy no college produces info banner `Select a College to manage Projects`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:592-600`
- vNext now: vNext no college shows PageHeader, nav and empty message `No college selected`. `src/app/(authenticated)/admin/projects/page.tsx:49-69`
- Fix: Use exact banner/icon/help copy and selector reference.

## G2-5-028-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy layout: header+actions, mutation alert, refreshing banner, fetch alert, Table. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:603-618,620-674`
- vNext now: vNext header, create/dropdown, nav, template warning, cards/table toggle, filter bar, export toolbar, list. `src/app/(authenticated)/admin/projects/page.tsx:135-170`
- Fix: Mirror compact legacy section ordering and visual density.

## G2-5-028-017  [P2] GAP  facet F05  effort M
- Legacy: Legacy Table default 10 rows per page, showSizeChanger true, scroll x=1200. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:657-673`
- vNext now: vNext default pageSize20, range10..100 and cards/table view toggles. `src/modules/projects/admin-projects-query-model.ts:10-16`, `src/app/(authenticated)/admin/projects/page.tsx:84-98`
- Fix: Default 10 rows and preserve size selector placement.

## G2-5-028-018  [P2] GAP  facet F05  effort M
- Legacy: Legacy fetch returns projects unsorted in component, backend list ordering. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:136-165`
- vNext now: vNext fetches server-paged snapshots filtered by status/search. `src/app/(authenticated)/admin/projects/page.tsx:104-133`
- Fix: Verify ordering between legacy project listing and snapshots; preserve default chronological ordering.

## G2-5-028-042  [P2] GAP  facet F10  effort M
- Legacy: Legacy getProjectsByCollege GET `/api/v1/admin/projects?collegeId` loads all. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:136-165`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectController.java:273-303`
- vNext now: vNext uses admin snapshot query for page and /api/projects GET for instances. `src/app/(authenticated)/admin/projects/page.tsx:104-133`, `src/app/api/projects/route.ts:12-27`
- Fix: Bridge legacy list response including slug/course/phase/mentor fields.

## G2-5-028-054  [P2] GAP  facet F13  effort M
- Legacy: Legacy stale request guard; error retry with last good rows; 8-row table skeleton on cold load. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:136-164,642-655`
- vNext now: vNext SSR query, route error state and retry link; no equivalent refresh skeleton in page. `src/app/(authenticated)/admin/projects/page.tsx:104-130`
- Fix: Restore refresh banner, 8-row skeleton and stale-data warning.

## G2-5-028-064  [P2] GAP  facet F18  effort M
- Legacy: Legacy title Projects, subtitle College project workspaces for students and mentors. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:606-617`
- vNext now: vNext `Workspaces`, subtitle `Live projects, each run by a mentor with a team of students.` `src/app/(authenticated)/admin/projects/page.tsx:49-61,135-138`
- Fix: Use exact page-head wording.

## G2-5-028-067  [P2] GAP  facet F19  effort M
- Legacy: Legacy list GET all then frontend Table paginates 10 per page. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:136-165,657-674`
- vNext now: vNext query pushes paging (20 default) into DB and CSV export from displayed page. `src/app/(authenticated)/admin/projects/page.tsx:104-133`, `src/modules/projects/admin-projects-query-model.ts:10-16`
- Fix: Preserve 10-row size option, clarify export scope.

## G2-12-028-036  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:281-300 no college selected shows warning or loading skeleton
- vNext now: src/app/(authenticated)/admin/projects/page.tsx:51-68 no-college EmptyState; vNext per-project team page requires project access
- Fix: Keep team tab shell and actionable college-switch hint on no scope

## G2-10-031-005  [P3] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:680-707,823-857 — jobs header filter row then table.
- vNext now: src/app/(authenticated)/admin/projects/page.tsx:135-197 — project view tabs, filter bar and list toolbar separate.
- Fix: Use shared legacy list hierarchy across admin list pages.

## G2-11-028-007  [P3] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:149-157`
- vNext now: `src/app/(authenticated)/admin/projects/page.tsx:137-153`
- Fix: Legacy title Deleted workspaces and subtitle Deleted workspaces you can still restore. are absent from vNext Workspaces header.

## G2-11-028-008  [P3] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:153-157`
- vNext now: `src/app/(authenticated)/admin/projects/page.tsx:146-149`
- Fix: Back to workspaces button on dedicated legacy page vs Create workspace/Bulk reassign in vNext More menu.
