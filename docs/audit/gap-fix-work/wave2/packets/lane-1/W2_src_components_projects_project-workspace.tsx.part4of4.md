# Work packet (wave 2): edit src/components/projects/project-workspace.tsx (part 4 of 4)

23 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l12-u028-superadmin-project-team.md, docs/audit/gap2/lane-8/l19-u028-superadmin-workspace-meetings.md, docs/audit/gap2/lane-10/l15-u028-superadmin-workspace-sprints.md, docs/audit/gap2/lane-2/l13-u028-superadmin-workspace-tasks.md, docs/audit/gap2/lane-3/superadmin-workspace-delivery.md, docs/audit/gap2/lane-4/superadmin-project-workspace-audit.md

## G2-12-028-007  [P2] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceTeamOverview.jsx:35-49 Primary mentor/Students/Supporting faculty/Task coverage counters
- vNext now: src/components/projects/project-workspace.tsx:757-799 only per-member cards
- Fix: Compute and show four counts and no-students value

## G2-12-028-009  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/workspaceRowMeta.jsx:79-83 member name falls back name/fullName/displayName/userName/mobile or dash
- vNext now: src/components/projects/project-workspace.tsx:764-770 displayName or 'Unnamed member'
- Fix: Use canonical fallback hierarchy without leaking masked contact data

## G2-12-028-011  [P2] MISSING  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceTeamOverview.jsx:43-48 task coverage shows learnersWithWork / total or 'No students yet'
- vNext now: src/components/projects/project-workspace.tsx:682-800 no learner workload ratio
- Fix: Calculate coverage from assigned active tasks

## G2-12-028-014  [P2] MISSING  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/workspaceRowMeta.jsx:134-137 pagination summary 'N–M of K matching members'
- vNext now: src/components/projects/project-workspace.tsx:732-799 no paging or summary
- Fix: Add exact pagination summary and disable size changer

## G2-12-028-041  [P2] GAP  facet F15  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/workspaceRowMeta.jsx:153-164 roster reconciliation only shows toast, no email
- vNext now: src/components/projects/project-workspace.tsx:725-730 no reconciliation
- Fix: On repair, avoid sending gratuitous team change emails; keep success toast

## G2-12-028-042  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/workspaceRowMeta.jsx:90-103 responsive AntD Space wrap and horizontally scrollable table
- vNext now: src/components/projects/project-workspace.tsx:732-799 grid 2 at md, 3 xl; no horizontal table scroll
- Fix: Match mobile/search/filter wrapping and horizontally scrolling 5-column table

## G2-12-028-044  [P2] MISSING  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/workspaceRowMeta.jsx:91-95 explicit aria-label for search and role filter
- vNext now: src/components/projects/project-workspace.tsx:732-799 no search/filter form controls
- Fix: Give new roster search and role select exact accessible labels

## G2-12-028-045  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceTeamOverview.jsx:56-62 'Team at a glance'/'Ownership and workload in one view'
- vNext now: src/components/projects/project-workspace.tsx:685-687 'Project people'
- Fix: Use legacy heading and secondary copy

## G2-19-028-002  [P2] GAP  facet F02  effort M
- Legacy: WorkspaceMeetingsEditor.jsx:39-59 Meeting plan intro and four stats
- vNext now: project-workspace.tsx:1466-1499 heading and actions without stats
- Fix: Restore old metric strip

## G2-19-028-005  [P2] GAP  facet F05  effort M
- Legacy: RepeatingItemEditor.jsx:99-137 search/reorder/delete row
- vNext now: project-workspace.tsx:1528-1651 read-only cards with individual actions
- Fix: Build list editor controls

## G2-19-028-017  [P2] GAP  facet F17  effort M
- Legacy: RepeatingItemEditor.jsx:115-137 aria-expanded and reorder labels
- vNext now: project-workspace.tsx:1528-1651 card actions
- Fix: Restore accessible reorder

## G2-19-028-024  [P2] GAP  facet F04  effort 
- Legacy: WorkspaceMeetingsEditor.jsx:32-37 linked/complete/requested counts
- vNext now: project-workspace.tsx:1500-1524 mentor Next meeting only
- Fix: Show all four admin counters

## G2-15-028-045  [P3] GAP  facet F19  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSprintsEditor.jsx:25-30 — summary metrics count from client 1 sprint array.
- vNext now: src/components/projects/project-workspace.tsx:835-905 — nested release loops, no summary count.
- Fix: Memoize totals for cards.

## G2-13-028-007  [P3] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceTasksEditor.jsx:68-81 info notice when zero sprints
- vNext now: src/components/projects/project-workspace.tsx:802-811 Execution heading even with no sprints
- Fix: Show exact No sprints are available yet notice and deep link.

## G2-13-028-008  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceTasksEditor.jsx:50-55 eyebrow Work breakdown and headline
- vNext now: src/components/projects/project-workspace.tsx:805-811 'Execution' and 'Release and sprint execution records.'
- Fix: Keep literal title/subtitle in task panel where page shell clone requires.

## G2-3-029-011  [P3] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceDeliveryOverview.jsx:70-85`
- vNext now: `src/components/projects/project-workspace.tsx:1320-1343`
- Fix: Legacy Primary submission with Open submitted file / Open source link labels; vNext Open source ↗, Open demo ↗ and evidence download in separate list.

## G2-3-029-012  [P3] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceDeliveryOverview.jsx:89-114`
- vNext now: `src/components/projects/project-workspace.tsx:1299-1318`
- Fix: Legacy count N additional items (correct plural) and No additional files or links. empty; vNext hides section when no attachments.

## G2-3-029-048  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceDeliveryOverview.jsx:70-83`
- vNext now: `src/components/projects/project-workspace.tsx:1320-1343`
- Fix: Open source link vs Open source ↗; Open submitted file label/filename not always present.

## G2-3-029-049  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceDeliveryOverview.jsx:89-118`
- vNext now: `src/components/projects/project-workspace.tsx:1299-1318`
- Fix: Additional evidence exact title exists but legacy additional-count and No additional files or links. absent.

## G2-4-029-007  [P3] GAP  facet F03  effort S
- Legacy: AuditOutlined icon on `View audit trail` action (`docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/audit.js:78-83`)
- vNext now: Underlined text link without icon (`src/components/projects/project-workspace.tsx:1669-1670`)
- Fix: Use icon-labeled secondary button.

## G2-7-012-029  [P3] GAP  facet F09  effort S
- Legacy: WorkspaceReadinessOverview.jsx:9-13 icons are status tags rather than menus
- vNext now: project-workspace.tsx:341-416 tags omitted
- Fix: Restore inline status tags without new popover

## G2-12-028-002  [P3] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:367-370 bulk reassign link inside mentor modal
- vNext now: src/components/projects/college-project-mentor-dialog.tsx:65-101 no bulk link in dialog; src/components/projects/project-workspace.tsx:695-700 bulk link outside
- Fix: Expose bulk reassign link within mentor dialog as legacy does

## G2-19-028-018  [P3] GAP  facet F18  effort M
- Legacy: WorkspaceMeetingsEditor.jsx:40,43 Meeting plan / Team cadence
- vNext now: project-workspace.tsx:1469 Meetings
- Fix: Use exact headings
