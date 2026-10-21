# Work packet (wave 2): edit src/components/projects/project-admin-workspace-list.tsx

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-projects-workspaces.md, docs/audit/gap2/lane-3/l11-u028-superadmin-deleted-workspaces.md, docs/audit/gap2/lane-4/project-workspace-model.md, docs/audit/gap2/lane-5/u028-superadmin-projects-section.md, docs/audit/gap2/lane-7/u019-college-admin-project-workspaces-list.md

## G2-10-028-003  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:211-218,281-293 — Open goes to workspace /summary?from=workspaces.
- vNext now: src/components/projects/project-admin-workspace-list.tsx:102-106 — Open goes to /admin/projects/:id without from token.
- Fix: Keep canonical summary and originating-list back link.

## G2-10-028-008  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:284-316 — Open and danger Archive with inbox icon.
- vNext now: src/components/projects/project-admin-workspace-list.tsx:102-107 and src/components/projects/project-archive-control.tsx:107-115 — link and neutral Archive.
- Fix: Restore danger icon and disabled styling.

## G2-10-028-012  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:238-244; docs/legacy-source/frontend/src/components/admin/projects/adminProjectUtils.js:171-192 — primary mentor then em dash fallback.
- vNext now: src/components/projects/project-admin-workspace-list.tsx:89 — mentorName or Unassigned.
- Fix: Match primary mentor resolution and placeholder.

## G2-10-028-045  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:375-399,445-452 — filters wrap, table has scroll.x max-content.
- vNext now: src/components/projects/project-admin-collection-controls.tsx:73-76 and src/components/projects/project-admin-workspace-list.tsx:111-136 — responsive form grid and compact list.
- Fix: Verify/mobile match table scroll and controls at 320/375/768px.

## G2-10-028-046  [P2] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:221-235 — attach-template Tag role button, tabIndex0, Enter/Space.
- vNext now: src/components/projects/project-admin-workspace-list.tsx:85-88 — missing-template text inert.
- Fix: Restore keyboard accessible attach-template action.

## G2-11-028-005  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:163-209`
- vNext now: `src/components/projects/project-admin-workspace-list.tsx:79-131`
- Fix: Legacy three-column Workspace/Mentor/Action table; vNext shared directory table adds status/progress/context plus optional cards view.

## G2-11-028-006  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:164-168`
- vNext now: `src/components/projects/project-admin-workspace-list.tsx:81-110`
- Fix: Legacy six-row Skeleton inside Card until deleted fetch finishes; vNext entire SSR listing loads via page boundary rather than in-card skeleton.

## G2-11-028-011  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:188-199`
- vNext now: `src/components/projects/project-admin-workspace-list.tsx:104-106`
- Fix: Legacy row action only Restore; vNext Archived row includes Open plus Restore, not isolated recoverable-delete action.

## G2-11-028-013  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:103-105`
- vNext now: `src/components/projects/project-admin-workspace-list.tsx:89-106`
- Fix: Legacy mentor display uses designated mentor lookup fallback; vNext page derives mentorName from active project membership, so deleted cascaded membership may be absent.

## G2-11-028-055  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:163-209`
- vNext now: `src/components/projects/project-admin-workspace-list.tsx:81-110`
- Fix: Legacy Table rowKeys support id/slug/numericId; vNext shared DataTable keyed UUID. No visible unstable duplicate IDs expected but migration case untested.

## G2-4-017-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy admin list supports workspaces and deleted-workspaces variants. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectWorkspaceRepository.java:162-173`)
- vNext now: New admin listing has cards/table and archive control. (`src/components/projects/project-admin-workspace-list.tsx:54-110`)
- Fix: Confirm deleted workspace recovery listing and matching navigation.

## G2-4-017-038  [P2] GAP  facet F09  effort M
- Legacy: Legacy repository has no modal behavior; downstream admin restore view is a separate page. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectWorkspaceRepository.java:162-173`)
- vNext now: New archive control action exists inline list. (`src/components/projects/project-admin-workspace-list.tsx:100-109`)
- Fix: Restore archived/deleted recovery control if historical workflows need it.

## G2-5-028-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy one antd Table with horizontal width1200, pagination inside table. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:657-674`
- vNext now: vNext table or cards with separate filters/pagination. `src/components/projects/project-admin-workspace-list.tsx:80-110,111-136`
- Fix: Match default table with inline page controls and column widths.

## G2-5-028-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy View opens 520px Drawer with details. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:676-713`
- vNext now: vNext Open navigates to full ProjectWorkspace detail page. `src/components/projects/admin-project-section-page.tsx:19-75`, `src/components/projects/project-admin-workspace-list.tsx:101-107`
- Fix: Add legacy quick-view drawer, keep deep-link as extra.

## G2-5-028-009  [P2] GAP  facet F03  effort M
- Legacy: Legacy badge tone done/evaluated, blocked/failed, review/pending. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:34-46`
- vNext now: vNext status tone success for ACTIVE/COMPLETED and neutral for others. `src/components/projects/project-admin-workspace-list.tsx:29-51,90-91`
- Fix: Map BLOCKED/REVIEW tones/labels exactly.

## G2-5-028-010  [P2] GAP  facet F03  effort M
- Legacy: Legacy empty CTA `Create project` creates modal. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:664-670`
- vNext now: vNext empty CTA `Clear filters` even when no workspaces. `src/components/projects/project-admin-workspace-list.tsx:69-76`
- Fix: Use actionable Create Project when list truly empty.

## G2-5-028-013  [P2] GAP  facet F04  effort M
- Legacy: Legacy title secondary line slug/id, missing values em dash. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:22-32,525-533`
- vNext now: vNext secondary line template name or `No template — attach one`, missing mentor `Unassigned`. `src/components/projects/project-admin-workspace-list.tsx:85-89`
- Fix: Show legacy slug and em dash on missing fields.

## G2-5-028-040  [P2] GAP  facet F09  effort M
- Legacy: Legacy Archive and Delete each Modal.confirm with destructive action. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:445-465`
- vNext now: vNext ProjectArchiveControl; delete not in list. `src/components/projects/project-admin-workspace-list.tsx:101-107`
- Fix: Implement matching confirm copy and soft delete/restore path.

## G2-5-028-052  [P2] GAP  facet F12  effort M
- Legacy: Legacy archive keeps visible in admin list, delete soft hides normal surfaces. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:445-465`
- vNext now: vNext archive status supported, deleted items separate/absent from mapped listing. `src/components/projects/project-admin-workspace-list.tsx:69-108`
- Fix: Reproduce exact archive vs delete visibility and restore.

## G2-5-028-055  [P2] GAP  facet F13  effort M
- Legacy: Legacy exact empty `No projects yet` with create CTA. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:662-671`
- vNext now: vNext empty description and clear filters CTA. `src/components/projects/project-admin-workspace-list.tsx:69-76`
- Fix: Distinguish zero total from zero filtered results and show legacy CTA.

## G2-5-028-061  [P2] GAP  facet F16  effort M
- Legacy: Legacy table x=1200 and 760px project modal; drawer width520. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:657-674,800-814`
- vNext now: vNext cards and responsive md grid, modal shared Dialog. `src/components/projects/project-admin-workspace-list.tsx:80-136`, `src/components/projects/project-create-control.tsx:229-230`
- Fix: Compare 375/768/1280 table overflow, dialog dimensions, drawer.

## G2-5-028-066  [P2] GAP  facet F18  effort M
- Legacy: Legacy heading `Project details`, labels `Next Action`, `Due`, `Blocker`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:682-694`
- vNext now: vNext table strips these metadata fields. `src/components/projects/project-admin-workspace-list.tsx:80-108`
- Fix: Restore labels/detail fields.

## G2-7-019-004  [P2] GAP  facet F01  effort S
- Legacy: workspaces/index.js:215-216,284-289 link lands `/summary?from=workspaces`
- vNext now: project-admin-workspace-list.tsx:104-105,148-149 links `/college/projects/{id}`
- Fix: Ensure workspace link lands Summary and preserves return target from workspaces.

## G2-7-019-008  [P2] GAP  facet F02  effort S
- Legacy: workspaces/index.js:430-453 one Table inside Card
- vNext now: project-admin-workspace-list.tsx:135-205 default 2-column card grid
- Fix: Render list table as default, preserve six legacy columns.

## G2-7-019-014  [P2] GAP  facet F03  effort S
- Legacy: workspaces/index.js:252-255 AntD colored status Tag
- vNext now: project-admin-workspace-list.tsx:29-40,90-91 StatusBadge tone; BLOCKED not red
- Fix: Map legacy status palette red blocked, green active/ready, blue in-progress, gray archived.

## G2-7-019-017  [P2] GAP  facet F04  effort S
- Legacy: workspaces/index.js:202-218 display title from title/name/projectTitle fallbacks
- vNext now: project-admin-workspace-list.tsx:85-87 uses item.title only
- Fix: Normalize historic null-name/fallback data before list projection.

## G2-7-019-021  [P2] GAP  facet F04  effort S
- Legacy: workspaces/index.js:250,254,450 mentor placeholder em dash via textOrDash; empty list exact messages
- vNext now: project-admin-workspace-list.tsx:89,145-146 `Unassigned` and generic empty title
- Fix: Use em dash for empty mentor, distinguish unfiltered vs filtered empty.

## G2-7-019-022  [P2] GAP  facet F04  effort S
- Legacy: workspaces/index.js:203-217 template ID missing warning and workspace name
- vNext now: college/projects/page.tsx:89-98 templateTitle derived by lookup; project-admin-workspace-list.tsx:85-88 fallback
- Fix: Use template-ID presence, not failure to resolve title, when deciding attach-template prompt.

## G2-7-019-048  [P2] GAP  facet F10  effort S
- Legacy: workspaces/index.js:210,215,284-289 navigate to summary with from link
- vNext now: project-admin-workspace-list.tsx:104-105 Open generic project detail
- Fix: Route to Summary section and retain from=workspaces for Back.

## G2-7-019-059  [P2] GAP  facet F13  effort S
- Legacy: workspaces/index.js:449-451 separate empty messages search vs no data
- vNext now: project-admin-workspace-list.tsx:69-77 configured generic `No Projects match these filters`
- Fix: Distinguish `No workspaces available for this college` from filtered empty.

## G2-7-019-069  [P2] GAP  facet F16  effort S
- Legacy: workspaces/index.js:347-355 Space wrap actions; 431-435 horizontal table scroll
- vNext now: college/projects/page.tsx:112-125 desktop/mobile links and details; project-admin-workspace-list.tsx:135-205 card grid
- Fix: Match wrapping header actions and horizontally scrollable table at tablet and phone.

## G2-7-019-085  [P2] GAP  facet F20  effort S
- Legacy: workspaces/index.js:209-215 URI encodes id; project fallback id/slug/numericId
- vNext now: project-admin-workspace-list.tsx:104-105 encodes UUID id only
- Fix: Resolve legacy slug/numeric ID deeplinks or redirect to UUID project.

## G2-10-028-009  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:245-263 — Ant colored Tag and Progress bar.
- vNext now: src/components/projects/project-admin-workspace-list.tsx:90-99 — StatusBadge and MetricBar.
- Fix: Match tag/bar sizes and colours.

## G2-10-028-011  [P3] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:214-220; docs/legacy-source/frontend/src/components/admin/projects/adminProjectUtils.js:64-75 — name fallback title/name/projectTitle/Workspace.
- vNext now: src/components/projects/project-admin-workspace-list.tsx:85-87 — raw title only.
- Fix: Use old fallback chain.

## G2-11-028-046  [P3] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:199-206`
- vNext now: `src/components/projects/project-admin-workspace-list.tsx:69-77`
- Fix: Legacy true empty No deleted workspaces for this college; vNext no archived rows shows No Projects match these filters.

## G2-11-028-058  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:193-206`
- vNext now: `src/components/projects/project-admin-workspace-list.tsx:69-77`
- Fix: Legacy exact empty and total label (... deleted workspaces) lost in vNext generic workspace list.

## G2-4-017-058  [P3] GAP  facet F16  effort S
- Legacy: Old field title160 and dueLabel80 enforce shorter widths. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:19-23`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:64-65`)
- vNext now: New title input max200 and dueLabel160, wraps in card. (`src/components/projects/college-project-summary-editor-full.tsx:64-80`; `src/components/projects/project-admin-workspace-list.tsx:115-126`)
- Fix: Check long labels do not overflow old shell widths.

## G2-5-028-008  [P3] GAP  facet F03  effort M
- Legacy: Legacy action icons eye, archive box, trash and row disabled when mutation busy. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:560-585`
- vNext now: vNext Open text link and ProjectArchiveControl, no equivalent eye/trash grouping. `src/components/projects/project-admin-workspace-list.tsx:101-107`
- Fix: Match icon/action compact affordances and pending disabled states.

## G2-7-019-015  [P3] GAP  facet F03  effort S
- Legacy: workspaces/index.js:255-263 Progress percent AntD Progress size small
- vNext now: project-admin-workspace-list.tsx:92-99 metric bar plus text percentage
- Fix: Match progress bar dimensions, percentage placement and accessible text.

## G2-7-019-023  [P3] GAP  facet F04  effort S
- Legacy: workspaces/index.js:260-262 displays percent as AntD Progress number
- vNext now: project-admin-workspace-list.tsx:92-99 progress bar and percent text
- Fix: Align precision and rendering of percent.
