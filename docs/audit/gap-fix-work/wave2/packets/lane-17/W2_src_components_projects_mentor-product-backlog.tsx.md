# Work packet (wave 2): edit src/components/projects/mentor-product-backlog.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/l13-u028-superadmin-workspace-tasks.md

## G2-13-028-021  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:109-115 estimate choices 1,2,3,5,8,13
- vNext now: src/components/projects/mentor-product-backlog.tsx:104-105 numeric estimate 0..1000
- Fix: Offer preset estimate options as legacy plus intentional custom unit support.

## G2-13-028-024  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:129-140 Description,Done when,Approach placeholders
- vNext now: src/components/projects/mentor-product-backlog.tsx:94-103 textarea details under Disclosure
- Fix: Restore exact text area labels, helper and placeholder hierarchy.

## G2-13-028-037  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/tasks.js:64-70 success reload
- vNext now: src/components/projects/mentor-product-backlog.tsx:81-84 refresh on individual create
- Fix: Preserve admin bulk save and predictable reload.

## G2-13-028-042  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/tasks.js:58-63 tasksToken CAS prevents overwriting concurrently changed plan
- vNext now: src/components/projects/mentor-product-backlog.tsx:39-49 per-task expectedUpdatedAt CAS
- Fix: Define whether per-task CAS covers entire plan edits including order and deletion.

## G2-13-028-043  [P2] GAP  facet F12  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:109-115 points selectable Fibonacci only
- vNext now: src/components/projects/mentor-product-backlog.tsx:104-105 allows integer0..1000
- Fix: Record deliberate estimation-policy change in form/help.

## G2-13-028-052  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceTasksEditor.jsx:84-104 vertical Ant form controls
- vNext now: src/components/projects/mentor-product-backlog.tsx:94-129 responsive grid Details disclosure
- Fix: Match row editor field spans and 44px touch target.

## G2-13-028-060  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/tasks.js:37-44 re-seed form synchronously after save
- vNext now: src/components/projects/mentor-product-backlog.tsx:39-49 optimistic per-task move and router refresh
- Fix: Avoid blanking task editor on save/refresh failure.

## G2-13-028-063  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/tasks.js:12 WorkspaceTasksEditor imports repeating editor
- vNext now: src/components/projects/mentor-product-backlog.tsx:13 projectMutation API and per-task CRUD components
- Fix: Centralize admin task form validation to task model instead of ad hoc UI schema.

## G2-13-028-065  [P2] GAP  facet F22  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/tasks.js:60-63 tasksToken section version
- vNext now: src/components/projects/mentor-product-backlog.tsx:45 expectedUpdatedAt optimistic task timestamp
- Fix: Store/compute task-plan CAS equivalent for bulk authoring.

## G2-13-028-020  [P3] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:92-96 Priority Low,Medium,High
- vNext now: src/components/projects/mentor-product-backlog.tsx:27-29 default priority MEDIUM, new enum casing
- Fix: Map title-case display to upper-case enum, preserve default.

## G2-13-028-046  [P3] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceTasksEditor.jsx:94-95 empty 'No tasks yet. Add the first task ...'
- vNext now: src/components/projects/mentor-product-backlog.tsx:159 EmptyState 'Backlog is empty.'
- Fix: Use matching task-plan empty message.

## G2-13-028-057  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceTasksEditor.jsx:73 'No sprints are available yet'
- vNext now: src/components/projects/mentor-product-backlog.tsx:159 'Backlog is empty.'
- Fix: Use correct no-sprints warning separate from no-tasks empty.
