# Work packet (wave 2): edit src/app/(authenticated)/college/projects/page.tsx

19 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/project-workspace-model.md, docs/audit/gap2/lane-7/u019-college-admin-project-workspaces-list.md

## G2-4-017-020  [P2] GAP  facet F05  effort M
- Legacy: Legacy mentor/learner list filter status/search/attention with server paging. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectWorkspaceRepository.java:23-59`)
- vNext now: New College admin workspaces filter q/status/page/pageSize, not attention in service query. (`src/app/(authenticated)/college/projects/page.tsx:45-60`)
- Fix: Match attention filters for mentor/learner lists and role-specific per-screen query.

## G2-4-017-021  [P2] GAP  facet F05  effort M
- Legacy: Legacy college admin filters SUBMITTED,NOT_SUBMITTED,AT_RISK,review subtypes and overrides. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectWorkspaceRepository.java:118-154`)
- vNext now: New College Projects list exposes status and search in current route. (`src/app/(authenticated)/college/projects/page.tsx:55-60`)
- Fix: Restore old report attention/view presets and exact result counts.

## G2-4-017-052  [P2] GAP  facet F13  effort M
- Legacy: Legacy project API feature flag denial stops operations. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:73-80`)
- vNext now: New college list shows missing college selection ErrorState and retry on data failure. (`src/app/(authenticated)/college/projects/page.tsx:34-86`)
- Fix: Test feature-disabled, missing membership, 403 and expired session as distinct states.

## G2-7-019-001  [P2] GAP  facet F01  effort S
- Legacy: workspaces/index.js:339-355 route `/college-admin/projects/workspaces` under AdminGroupShell projects
- vNext now: college/projects/page.tsx:103-115 `/college/projects` under ProjectAdminNav
- Fix: Keep old deep-link via redirect and provide matching `Project workspaces` landing heading.

## G2-7-019-006  [P2] GAP  facet F02  effort S
- Legacy: workspaces/index.js:339-356 tabs then page head, error banner, Workspaces Card
- vNext now: college/projects/page.tsx:103-141 PageHeader, collapsible tools, view tabs, warning, filter bar, toolbar, list
- Fix: Match section ordering and remove nonlegacy intermediate tools and view tabs from default screen.

## G2-7-019-007  [P2] GAP  facet F02  effort S
- Legacy: workspaces/index.js:362-426 titled Card `Workspaces` with search, status and export in its extra row
- vNext now: college/projects/page.tsx:127-141 separate Tabs, FilterBar and ListToolbar
- Fix: Place title and controls in one legacy-like Workspaces section, maintain shared canvas.

## G2-7-019-009  [P2] GAP  facet F03  effort S
- Legacy: workspaces/index.js:342-345 h1 `Project workspaces` and subtitle
- vNext now: college/projects/page.tsx:109-115 title `Workspaces`, same subtitle
- Fix: Use exact `Project workspaces` heading.

## G2-7-019-010  [P2] GAP  facet F03  effort S
- Legacy: workspaces/index.js:348-350 three top-right actions unconditionally visible
- vNext now: college/projects/page.tsx:112-125 only Create visible; other action inside details; Deleted absent
- Fix: Show all three head buttons, same order and labels.

## G2-7-019-022  [P2] GAP  facet F04  effort S
- Legacy: workspaces/index.js:203-217 template ID missing warning and workspace name
- vNext now: college/projects/page.tsx:89-98 templateTitle derived by lookup; project-admin-workspace-list.tsx:85-88 fallback
- Fix: Use template-ID presence, not failure to resolve title, when deciding attach-template prompt.

## G2-7-019-025  [P2] GAP  facet F05  effort S
- Legacy: workspaces/index.js:339-453 table is default and only view
- vNext now: college/projects/page.tsx:127-135 Cards default, List and Archived tabs
- Fix: Default `view=table`; keep alternative cards only if explicitly approved as extra.

## G2-7-019-046  [P2] GAP  facet F10  effort S
- Legacy: AdminService.js:377-380 GET `/api/v1/admin/projects/page?collegeId&status&search&page&size`
- vNext now: college/projects/page.tsx:63-70 direct listProjectAdminSnapshots DB service
- Fix: Preserve filtering, tenant scope, pagination and client-visible error semantics despite internal implementation change.

## G2-7-019-050  [P2] GAP  facet F11  effort S
- Legacy: workspaces/index.js:30-35 college from redux loginUser; missing college warning lines321-337
- vNext now: college/projects/page.tsx:34-42 college from request context with dashboard return
- Fix: Match college-assignment warning and preserve project navigation shell.

## G2-7-019-058  [P2] GAP  facet F13  effort S
- Legacy: workspaces/index.js:427-429 AntD Skeleton active six rows
- vNext now: college/projects/page.tsx:63-70 async server response; no list-level Skeleton in inspected page
- Fix: Restore six-row list placeholder on navigation and filter refresh.

## G2-7-019-060  [P2] GAP  facet F13  effort S
- Legacy: workspaces/index.js:358-360 retry action in same tab and card
- vNext now: college/projects/page.tsx:71-86 full ErrorState page
- Fix: Keep filters/sidebar/header and list card recoverable with inline retry.

## G2-7-019-062  [P2] GAP  facet F13  effort S
- Legacy: workspaces/index.js:321-337 missing college warning in group shell
- vNext now: college/projects/page.tsx:34-42 separate ErrorState with Back dashboard
- Fix: Keep projects tab strip visible while warning on missing college.

## G2-7-019-069  [P2] GAP  facet F16  effort S
- Legacy: workspaces/index.js:347-355 Space wrap actions; 431-435 horizontal table scroll
- vNext now: college/projects/page.tsx:112-125 desktop/mobile links and details; project-admin-workspace-list.tsx:135-205 card grid
- Fix: Match wrapping header actions and horizontally scrollable table at tablet and phone.

## G2-7-019-074  [P2] GAP  facet F18  effort S
- Legacy: workspaces/index.js:342-345 `Project workspaces`, `Live projects, each run by a mentor with a team of students.`
- vNext now: college/projects/page.tsx:109-115 `Workspaces`, identical subtitle
- Fix: Match heading text exactly.

## G2-7-019-077  [P2] GAP  facet F18  effort S
- Legacy: workspaces/index.js:449-450 two distinct no-results strings
- vNext now: college/projects/page.tsx:145-146 generic no Project filters
- Fix: Restore both `No workspaces match your search/filter` and `No workspaces available for this college`.

## G2-7-019-097  [P2] GAP  facet F23  effort S
- Legacy: workspaces/index.js:348-350 `Bulk reassign mentor` prominent action
- vNext now: college/projects/page.tsx:118-125 collapsed under tools, additional class tools
- Fix: Retain existing tool but move directly to heading actions.
