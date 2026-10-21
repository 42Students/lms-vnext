# Work packet: edit src/components/projects/mentor-product-backlog.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/l13-u028-superadmin-workspace-tasks.md

## G2-13-028-061  [P1] GAP  facet F20  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/tasks.js:58-63 tasksToken original snapshot CAS
- vNext now: src/components/projects/mentor-product-backlog.tsx:45 expectedUpdatedAt task token
- Fix: Implement section-level CAS for bulk edits and conflict user messaging.

## G2-13-028-025  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceTasksEditor.jsx:85-89 validateRepeatingItems(fields)
- vNext now: src/components/projects/mentor-product-backlog.tsx:68-69 generic task title and estimate validation
- Fix: Restore per-row indexed field validation, preserve unsaved rows.

## G2-13-028-031  [P2] GAP  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/tasks.js:70 reload after saved toast without reset
- vNext now: src/components/projects/mentor-product-backlog.tsx:81-84 refresh after add, not same bulk plan
- Fix: Keep saved task rows visible until refreshed snapshot arrives.

## G2-13-028-027  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/tasks.js:71-72 fallback 'Failed to update tasks' modal
- vNext now: src/components/projects/mentor-product-backlog.tsx:83-84 'Could not add backlog task' inline notice
- Fix: Use exact admin task plan save error and conflict recovery.

## G2-13-028-029  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/tasks.js:64 `Tasks updated` success toast
- vNext now: src/components/projects/mentor-product-backlog.tsx:80-84 backlog add notice distinct
- Fix: Restore admin plan toast and duration.
