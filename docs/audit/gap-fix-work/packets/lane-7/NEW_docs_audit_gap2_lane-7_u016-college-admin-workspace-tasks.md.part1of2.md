# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/u016-college-admin-workspace-tasks.md (part 1 of 2)

20 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u016-college-admin-workspace-tasks.md

## G2-7-016-004  [P1] GAP  facet F02  effort L
- Legacy: LFE/components/admin/projects/WorkspaceTasksEditor.jsx:38-66 Task plan Card, Work breakdown intro, four metrics
- vNext now: V/components/projects/project-workspace.tsx:802-839 Execution heading and release roadmap
- Fix: Restore Task plan hierarchy/metrics before task edit

## G2-7-016-005  [P1] GAP  facet F02  effort L
- Legacy: LFE/components/admin/projects/WorkspaceTasksEditor.jsx:67-107 no-sprints Alert, inline multirow task editor and Save footer
- vNext now: V/components/projects/project-workspace.tsx:851-1180 per-sprint nested tasks, individual task controls
- Fix: Provide bulk editing and one scoped Save with concurrency

## G2-7-016-011  [P1] GAP  facet F04  effort M
- Legacy: LFE/components/admin/projects/WorkspaceTasksEditor.jsx:25-34 submissions from resolvedTasks with truthy submissionUrl
- vNext now: V/modules/projects/workspace-view-service.ts:24-25,55-58 taskSubmissions normalized separately
- Fix: Project latest evidence per task into submissions counter

## G2-7-016-014  [P1] GAP  facet F05  effort L
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:98-139 >12 rows searchable/collapsible, order up/down, remove/Undo
- vNext now: V/components/projects/project-workspace.tsx:1010-1180 no common bulk repeating list
- Fix: Restore row search, reorder and reversible local deletion

## G2-7-016-020  [P1] GAP  facet F06  effort M
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:117-140 taskType STORY/BUG/CHORE/SPIKE, dueLabel text, Description, Done when, Approach
- vNext now: V/components/projects/mentor-task-create.tsx:100-174 types match, but Due date replaces dueLabel and Done/Approach inside disclosure
- Fix: Keep legacy dueLabel, helper and field grouping

## G2-7-016-023  [P1] GAP  facet F06  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/tasks.js:33-42 reset/refill then useUnsavedFormGuard
- vNext now: V/components/projects/mentor-task-create.tsx:43-50 modal discard guard only
- Fix: Guard Back, tabs and unload for in-page plan

## G2-7-016-034  [P1] GAP  facet F10  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/tasks.js:66-80 PUT tasks + tasksToken after latest sibling fetch
- vNext now: V/modules/projects/mentor-task-create-service.ts:19-122 per-task POST and task edit services
- Fix: Provide atomic batch workflow or partial-write reconciliation

## G2-7-016-035  [P1] GAP  facet F10  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/tasks.js:68-79 materializeSectionKeys maps provisional sprint/task links before save
- vNext now: V/modules/projects/mentor-task-create-service.ts:42-59 validates UUID sprint and lifecycle
- Fix: Map old sprint/task keys to stable UUIDs losslessly

## G2-7-016-036  [P1] GAP  facet F10  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/tasks.js:77-80 tasksToken prevents whole-array stale overwrite
- vNext now: V/modules/projects/mentor-task-create-service.ts:33-95 per-task create locks but no tasksToken
- Fix: Define equivalent concurrency on task bulk mutations

## G2-7-016-038  [P1] GAP  facet F11  effort L
- Legacy: LFE/components/admin/projects/WorkspaceTasksEditor.jsx:50-107 College Admin authors tasks in editable plan
- vNext now: V/modules/projects/mentor-task-create-service.ts:22-31 only MENTOR membership permitted on create
- Fix: Give College Admin authorized planning endpoint or remove dead-end create control

## G2-7-016-042  [P1] GAP  facet F12  effort L
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:280-345 key generation preserves task->sprint links
- vNext now: V/db/schema/projects.ts:397-498 UUID sprint/task and project templateKey
- Fix: Carry key mapping and linked meetings through migration

## G2-7-016-056  [P1] GAP  facet F17  effort M
- Legacy: LFE/components/admin/projects/useUnsavedFormGuard.js:31-61 keyboard Back/Forward and tab-switch guard
- vNext now: V/components/projects/mentor-task-create.tsx:50,171-176 dialog-only discard guard
- Fix: Guard page navigation for dirty plan edits

## G2-7-016-064  [P1] GAP  facet F20  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/tasks.js:66-80 latest sibling key snapshot + tasksToken
- vNext now: V/modules/projects/mentor-task-create-service.ts:33-94 project/sprint locking and expectedSprintUpdatedAt
- Fix: Test concurrent add/edit/remove and stale sprint reference

## G2-7-016-067  [P1] GAP  facet F22  effort L
- Legacy: LFE/dto/projects/ProjectTaskDTO.java:8-62 legacy taskKey/dueLabel/sprintKey/status/submittedBy/time/carriedOver/createdByType
- vNext now: V/db/schema/projects.ts:397-498 UUID task, dueDate, FK sprint, submissions in separate table
- Fix: Define lossless task DTO projection and migration for historical fields

## G2-7-016-068  [P1] GAP  facet F22  effort L
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:90-140 10 authorable task fields, fixed estimate list
- vNext now: V/modules/projects/mentor-task-create-model.ts:6-25 more state/assignee/blocker fields and 200/4000 limits
- Fix: Inventory field defaults and validation mapping

## G2-7-016-069  [P1] GAP  facet F22  effort L
- Legacy: LFE/dto/projects/ProjectWorkspaceUpdateDTO.java:20,33-35 tasks array + tasksToken
- vNext now: V/db/schema/projects.ts:397-498 normalized rows with unique template key, sequence
- Fix: Preserve array order, key uniqueness and section CAS

## G2-7-016-071  [P1] GAP  facet F23  effort L
- Legacy: LFE/components/admin/projects/WorkspaceTasksEditor.jsx:108-165 separate submissions table
- vNext now: V/components/projects/project-workspace.tsx:1010-1180 evidence in individual task cards
- Fix: Restore consolidated submitted work table

## G2-7-016-024  [P2] GAP  facet F07  effort M
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:250-276 required title validation Item N: Title required, MAX_SECTION_ROWS 500
- vNext now: V/modules/projects/mentor-task-create-model.ts:6-25 per-task Zod max200, no batch row index
- Fix: Restore row-indexed errors and 500-row batch validation

## G2-7-016-025  [P2] GAP  facet F07  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/tasks.js:87-90 project-error modal fallback Failed to update tasks
- vNext now: V/components/projects/mentor-task-create.tsx:55-75 create failure toast
- Fix: Map section error wording and conflict recovery

## G2-7-016-026  [P2] GAP  facet F07  effort S
- Legacy: LFE/components/admin/projects/WorkspaceTasksEditor.jsx:138-146 unsafe URL displays Unavailable link instead of anchor
- vNext now: V/components/projects/project-workspace.tsx:1095-1101 hides link if unsafe
- Fix: Display unopenable submission placeholder
