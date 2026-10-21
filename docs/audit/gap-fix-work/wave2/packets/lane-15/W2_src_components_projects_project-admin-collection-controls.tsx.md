# Work packet (wave 2): edit src/components/projects/project-admin-collection-controls.tsx

21 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/cross-10-list-conventions.md, docs/audit/gap2/lane-10/superadmin-projects-workspaces.md, docs/audit/gap2/lane-3/l11-u028-superadmin-deleted-workspaces.md, docs/audit/gap2/lane-7/u001-college-admin-projects-at-risk.md, docs/audit/gap2/lane-7/u019-college-admin-project-workspaces-list.md

## G2-10-031-014  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:64-66,98-106 — status all/draft/active/closed, query hydrated.
- vNext now: src/components/projects/project-admin-collection-controls.tsx:30-35,87-100 — different statuses and Apply submission.
- Fix: Match each list's status model and clear URL defaults.

## G2-10-031-015  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:118-135 — 400ms debounced text search; keeps Back page.
- vNext now: src/components/projects/project-admin-collection-controls.tsx:73-85,151-163 — form Apply for project filter.
- Fix: Adopt debounced search with robust deep links.

## G2-10-028-019  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:136-186,382-389 — search changes fetch after 350ms debounce.
- vNext now: src/components/projects/project-admin-collection-controls.tsx:73-85,151-156 — user must click Apply.
- Fix: Restore immediate debounced search.

## G2-10-028-021  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:452-461 — pagination 10/20/50/100, default20, x-y of total text.
- vNext now: src/components/projects/project-admin-collection-controls.tsx:135-149,167-218 — same sizes/default but Page x of y summary.
- Fix: Match pagination position/counter wording.

## G2-10-028-023  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:382-399 — search and status allowClear with auto-update.
- vNext now: src/components/projects/project-admin-collection-controls.tsx:77-100,151-163 — GET form Apply/Clear actions.
- Fix: Restore clearable one-click controls.

## G2-10-028-024  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:452-460 — table page-size changer applies on change.
- vNext now: src/components/projects/project-admin-collection-controls.tsx:135-156 — Rows size requires Apply.
- Fix: Apply page size immediately.

## G2-10-028-045  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:375-399,445-452 — filters wrap, table has scroll.x max-content.
- vNext now: src/components/projects/project-admin-collection-controls.tsx:73-76 and src/components/projects/project-admin-workspace-list.tsx:111-136 — responsive form grid and compact list.
- Fix: Verify/mobile match table scroll and controls at 320/375/768px.

## G2-11-028-016  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:30-38`
- vNext now: `src/components/projects/project-admin-collection-controls.tsx:30-37`
- Fix: Legacy dedicated deleted list has no status/search filters, only page/size; vNext user must choose ARCHIVED from Workspace status filter.

## G2-11-028-017  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:191-206`
- vNext now: `src/components/projects/project-admin-collection-controls.tsx:137-149`
- Fix: Legacy page sizes 10,20,50,100 and total string N-M of N deleted workspaces; vNext directory supports 10/20/50/100 but generic pagination copy.

## G2-7-001-058  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:351-358: `At-risk workspaces (CSV covers the displayed page)`; `Search workspace title or ID`.
- vNext now: V/components/projects/project-admin-at-risk-page.tsx:96; components/projects/project-admin-collection-controls.tsx:83: shortened heading; `Workspace title or slug`.
- Fix: Restore exact section title and search copy.

## G2-7-019-011  [P2] GAP  facet F03  effort S
- Legacy: workspaces/index.js:367-385 search box and status picker with allowClear
- vNext now: project-admin-collection-controls.tsx:77-101 labelled Search/Workspace status, separate Apply and Clear
- Fix: Match inline search and clearable select interaction without Apply/Clear requirement.

## G2-7-019-026  [P2] GAP  facet F05  effort S
- Legacy: workspaces/index.js:367-372 input Search title or slug; debounced 350 ms when typing
- vNext now: project-admin-collection-controls.tsx:73-85 input `Workspace title or slug`, form Submit Apply
- Fix: Restore exact placeholder and live 350ms search.

## G2-7-019-032  [P2] GAP  facet F06  effort S
- Legacy: workspaces/index.js:367-372 Search allowClear, empty initial value
- vNext now: project-admin-collection-controls.tsx:77-85 search input with `defaultValue` and form
- Fix: Support immediate clear; filter applied without extra submit.

## G2-7-019-034  [P2] GAP  facet F06  effort S
- Legacy: workspaces/index.js:436-447 pagination size selection directly triggers fetch
- vNext now: project-admin-collection-controls.tsx:135-155 page size requires Apply
- Fix: Apply page-size changes without separate confirmation.

## G2-7-019-075  [P2] GAP  facet F18  effort S
- Legacy: workspaces/index.js:367-376 `Search title or slug` and `Status`
- vNext now: project-admin-collection-controls.tsx:78-98 `Search`, `Workspace title or slug`, `Workspace status`
- Fix: Restore both placeholders and avoid different field labels.

## G2-7-019-080  [P2] GAP  facet F19  effort S
- Legacy: workspaces/index.js:171-181 350ms search debounce only keystrokes
- vNext now: project-admin-collection-controls.tsx:73-155 GET form explicit submit
- Fix: Restore debounce with request cancelation for live text searching.

## G2-10-031-008  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:699-715 — Search jobs label and four status options.
- vNext now: src/components/projects/project-admin-collection-controls.tsx:77-100 — generic project search/other statuses; list widgets have no cross-page uniform naming.
- Fix: Match per-resource labels, avoid one-size-fits-all statuses.

## G2-10-028-049  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:389,435 — Search title or slug, Export this page.
- vNext now: src/components/projects/project-admin-collection-controls.tsx:79-84 and src/components/projects/project-workspace-page-export.tsx:22-25 — search matches, export label diverges.
- Fix: Restore export wording.

## G2-7-019-029  [P3] GAP  facet F05  effort S
- Legacy: workspaces/index.js:440-442 `1-20 of N workspaces` total range
- vNext now: project-admin-collection-controls.tsx:212-216 `N results · Page X of Y`
- Fix: Render row range plus total with exact legacy suffix.

## G2-7-019-033  [P3] GAP  facet F06  effort S
- Legacy: workspaces/index.js:373-385 clearable Status defaults undefined
- vNext now: project-admin-collection-controls.tsx:87-101 explicit All statuses option, defaults empty
- Fix: Match status picker clear button and placeholder `Status`.

## G2-7-019-070  [P3] GAP  facet F16  effort S
- Legacy: workspaces/index.js:367-376 width240px search/filter in responsive Space
- vNext now: project-admin-collection-controls.tsx:73-75 grid 1/2/4 columns
- Fix: Compare search width and toolbar wrapping at 375,768,1280; match legacy compact layout.
