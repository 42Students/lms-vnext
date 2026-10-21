# Work packet (wave 2): edit src/components/projects/project-archive-control.tsx

19 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-projects-workspaces.md, docs/audit/gap2/lane-3/l11-u028-superadmin-deleted-workspaces.md, docs/audit/gap2/lane-5/l14-u028-superadmin-workspace-summary.md, docs/audit/gap2/lane-7/u019-college-admin-project-workspaces-list.md

## G2-10-028-008  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:284-316 — Open and danger Archive with inbox icon.
- vNext now: src/components/projects/project-admin-workspace-list.tsx:102-107 and src/components/projects/project-archive-control.tsx:107-115 — link and neutral Archive.
- Fix: Restore danger icon and disabled styling.

## G2-10-028-031  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:302-320 — anchored Ant Popconfirm, danger OK, busy state.
- vNext now: src/components/projects/project-archive-control.tsx:116-133 — full Dialog with Cancel and Archive project.
- Fix: Restore popconfirm trigger/layout.

## G2-11-028-009  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:104-133`
- vNext now: `src/components/projects/project-archive-control.tsx:81-107`
- Fix: Legacy Restore primary button with UndoOutlined icon inside row Popconfirm; vNext Restore secondary button embedded in status-dependent row control and Dialog.

## G2-11-028-010  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:117-120`
- vNext now: `src/components/projects/project-archive-control.tsx:90-101`
- Fix: Legacy Popconfirm warns template-specific task/sprint/resource edits unrecoverable; vNext Dialog promises all such edits preserved.

## G2-11-028-022  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:107-110`
- vNext now: `src/components/projects/project-archive-control.tsx:10-22`
- Fix: Legacy restore ID falls back id or slug or numericId; vNext projectId UUID path and ISO updatedAt token, historical alias must be translated.

## G2-11-028-029  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:115-133`
- vNext now: `src/components/projects/project-archive-control.tsx:87-107`
- Fix: Legacy Restore this workspace? Ant Popconfirm anchored to primary icon button, vNext full Dialog with footer buttons and content-preservation note.

## G2-11-028-030  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:158-160`
- vNext now: `src/components/projects/project-archive-control.tsx:87-107`
- Fix: Legacy Retry button is in the Empty body, vNext reload link in full ErrorState; focus/context restore differs.

## G2-11-028-031  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:117-123`
- vNext now: `src/components/projects/project-archive-control.tsx:90-100`
- Fix: Legacy Restore confirmation detailed loss-of-edits warning, vNext restore dialog states exact opposite; cannot clone behavior without reconciling semantics.

## G2-11-028-051  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:188-197`
- vNext now: `src/components/projects/project-archive-control.tsx:29-47`
- Fix: Legacy archive emits workspace archived toast and may notify; vNext archive toast says Project archived and remains reviewable.

## G2-11-028-053  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:115-132`
- vNext now: `src/components/projects/project-archive-control.tsx:87-104`
- Fix: Legacy anchored small Popconfirm on desktop/phone vs vNext full responsive Dialog; touch/viewport layout differs.

## G2-11-028-054  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:116-128`
- vNext now: `src/components/projects/project-archive-control.tsx:82-107`
- Fix: Legacy icon button keyboard and Popconfirm focus flow vs vNext dialog opener, Cancel, Restore, focus restoration; test screen reader labels.

## G2-11-028-057  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:114-133`
- vNext now: `src/components/projects/project-archive-control.tsx:87-107`
- Fix: Legacy restore message warns shell/members/meetings restored but tasks/sprints/resources regenerated from template; vNext explicitly says restored with edits.

## G2-11-028-063  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:68-92`
- vNext now: `src/components/projects/project-archive-control.tsx:26-79`
- Fix: Legacy can trigger two different restore IDs concurrently because restoringId per button; vNext inFlight ref local per row and CAS guards concurrent restoration.

## G2-14-028-062  [P2] GAP  facet F21  effort M
- Legacy: Legacy AdminService update/archive/delete/attach and projectUtils. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:30-48`
- vNext now: vNext domain services, Drizzle and API fetch, no old REST contract. `src/modules/projects/college-project-summary-service.ts:13-81`, `src/components/projects/project-archive-control.tsx:29-75`
- Fix: Provide route and ID compatibility map.

## G2-7-019-016  [P2] GAP  facet F03  effort S
- Legacy: workspaces/index.js:293-311 Archive danger icon and disabled archived
- vNext now: project-archive-control.tsx:107-135 neutral secondary Archive button, archived becomes Restore
- Fix: Render Archive as danger action; avoid surfacing Restore on active list unless archived recovery intended.

## G2-7-019-035  [P2] GAP  facet F06  effort S
- Legacy: workspaces/index.js:293-312 archive Popconfirm Archive action
- vNext now: project-archive-control.tsx:116-129 dialog with Cancel and Archive project
- Fix: Match compact confirmation label, danger presentation and trigger response.

## G2-7-019-043  [P2] GAP  facet F09  effort S
- Legacy: workspaces/index.js:293-313 Popconfirm anchored at Archive button
- vNext now: project-archive-control.tsx:116-135 full Dialog overlay
- Fix: Choose shared popconfirm with same trigger, button text and focus behaviour.

## G2-7-019-055  [P2] GAP  facet F12  effort S
- Legacy: adminProjectUtils.js:169 archived detection substring; workspaces/index.js:299-310 disable archive
- vNext now: project-archive-control.tsx:81-105 Archived surfaces Restore, others Archive
- Fix: Mirror disabled archive on archived row where archived appears in same list.

## G2-7-019-078  [P2] GAP  facet F18  effort S
- Legacy: workspaces/index.js:294-306 Archive this workspace?/Archive
- vNext now: project-archive-control.tsx:119-125 Archive project?/Archive project
- Fix: Align dialog title, action, toast terminology to Workspace.
