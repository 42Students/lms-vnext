# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/u016-college-admin-workspace-tasks.md (part 2 of 2)

3 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u016-college-admin-workspace-tasks.md

## G2-7-016-027  [P2] GAP  facet F07  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/tasks.js:119-139 load error Workspace could not be loaded with Retry and Workspace not found
- vNext now: V/components/projects/admin-project-section-page.tsx:38-47 awaited server fetch/error boundary
- Fix: Add recoverable section error and 404

## G2-7-016-028  [P2] GAP  facet F08  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/tasks.js:57-60,79-81 info No changes to save and success Tasks updated
- vNext now: V/components/projects/mentor-task-create.tsx:55-75 Task created notification
- Fix: Restore feedback for equivalent plan save

## G2-7-016-029  [P2] GAP  facet F08  effort M
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:104-108 Item removed from this unsaved form, Undo remove
- vNext now: V/components/projects/project-workspace.tsx:1137-1180 individual actions with no staged removal notice
- Fix: Bring back reversible edit notice
