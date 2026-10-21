# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/u014-college-admin-workspace-sprints.md

20 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u014-college-admin-workspace-sprints.md

## G2-7-014-004  [P1] GAP  facet F02  effort M
- Legacy: LFE/components/admin/projects/WorkspaceSprintsEditor.jsx:33-43 first Card Sprint plan, eyebrow Delivery cadence, headline and helper paragraph
- vNext now: V/components/projects/project-workspace.tsx:802-811: Execution heading, Release and sprint execution records subtext
- Fix: Restore Sprint plan introduction before release cards

## G2-7-014-007  [P1] GAP  facet F02  effort L
- Legacy: LFE/components/admin/projects/WorkspaceSprintsEditor.jsx:81-103 repeating editor plus one Save sprint plan footer
- vNext now: V/components/projects/project-workspace.tsx:851-1000 release cards with per-sprint CRUD and lifecycle controls
- Fix: Implement equivalent bulk editable sprint plan + atomic save or explicitly approve different workflow

## G2-7-014-014  [P1] GAP  facet F04  effort M
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:26-72 fields key, dueLabel, title, goal, releaseKey, description; releaseLabel filtered in workspace
- vNext now: V/components/projects/mentor-sprint-write.tsx:94-127 includes title, description, goal, definitionOfDone, startDate, endDate, dueDate and releaseId; no dueLabel
- Fix: Map dueLabel and legacy sprint key; retain original field semantics

## G2-7-014-016  [P1] GAP  facet F04  effort L
- Legacy: LFE/dto/projects/ProjectSprintDTO.java:8-42 includes sprintKey, dueLabel, sprintState, releaseKey, progress, taskCount, completedTaskCount, created/updated by
- vNext now: V/db/schema/projects.ts:328-397 normalized sprint id/releaseId, status, dates, goal, definitionOfDone, sequence
- Fix: Document full DTO field mapping; preserve dueLabel and historical attribution in view projection

## G2-7-014-027  [P1] GAP  facet F06  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/sprints.js:26-37 useUnsavedFormGuard covers back/tab/unload
- vNext now: V/components/projects/mentor-sprint-write.tsx:32-37 modal discard guard, per-sprint details separately guarded
- Fix: Protect full-page multirow plan edits across navigation

## G2-7-014-029  [P1] GAP  facet F07  effort M
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:250-276 required Title+releaseKey and max500, errors `Item N: Title, Release key required`
- vNext now: V/modules/projects/mentor-sprint-write-model.ts:5-16 title min/max and UUID releaseId, no bulk 500 validator
- Fix: Map exact per-row errors for bulk editor and 500-row cap

## G2-7-014-036  [P1] GAP  facet F09  effort L
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:104-108 inline Undo remove message
- vNext now: V/components/projects/mentor-sprint-delete-control.tsx:1-110 likely delete dialog; no local staged Undo in ProjectWorkspace view:945-949
- Fix: Provide reversible removal path or record hard-delete vs staged edit rationale

## G2-7-014-040  [P1] GAP  facet F10  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/sprints.js:97-110 PUT updateProject with `{sprints,sprintsToken}` after refreshWorkspaceForSave
- vNext now: V/modules/projects/mentor-sprint-write-service.ts:20-87 POST create row, row mutations PATCH/transition via separate endpoints
- Fix: Provide atomic plan update or explicit failure recovery for partial per-sprint saves

## G2-7-014-041  [P1] GAP  facet F10  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/sprints.js:78-83 stampSprintClientIds before links and save
- vNext now: V/modules/projects/mentor-sprint-write-service.ts:45-66 generates templateKey mentor UUID and id
- Fix: Maintain links across provisional key to final UUID conversion on migration

## G2-7-014-048  [P1] GAP  facet F12  effort L
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:217-242,280-345 stable `_clientId` before title changes; remaps task sprintKey
- vNext now: V/db/schema/projects.ts:328-397 releaseId UUID, projectTasks.sprintId FK
- Fix: Map provisional keys and dependent tasks safely in import/migration

## G2-7-014-054  [P1] GAP  facet F13  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/sprints.js:47-71 independent releases fetch cancellation
- vNext now: V/modules/projects/workspace-view-service.ts:37-67 all sections fetched in same Promise.all
- Fix: Avoid unrelated project aggregate fetch masking sprint-only data

## G2-7-014-069  [P1] GAP  facet F20  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/sprints.js:78-83,97-110 client IDs stamped, fresh siblings, sprintsToken CAS
- vNext now: V/modules/projects/mentor-sprint-write-service.ts:20-87 project lock create; DB unique and per-row CAS updates
- Fix: Write concurrency tests for title rename, key remap and simultaneous editors

## G2-7-014-073  [P1] GAP  facet F22  effort L
- Legacy: LFE/model/ProjectSprint.java:27-118 ID integer, unique (project_id,sprint_key), version, sprintStatus + sprintState, dueLabel, releaseId
- vNext now: V/db/schema/projects.ts:328-397 UUID, templateKey varchar64, releaseId UUID FK, one status, updatedAt
- Fix: Produce lossless mapping including dueLabel, derived status, version and historical started/completed attribution

## G2-7-014-074  [P1] GAP  facet F22  effort L
- Legacy: LFE/dto/projects/ProjectSprintDTO.java:8-44 released-linked data, metrics and original key/label fields
- vNext now: V/db/schema/projects.ts:328-397 sprint core fields; separate workspace view derives release/task metrics
- Fix: Expose all legacy visible fields/metrics in projection even if normalized

## G2-7-014-075  [P1] GAP  facet F22  effort M
- Legacy: LFE/model/ProjectSprint.java:87-114 startedBy/At and completedBy/At persisted
- vNext now: V/db/schema/projects.ts:328-369 no attribution columns in project_sprints declaration
- Fix: Retain start/completion attribution via activity rows with migration and view

## G2-7-014-030  [P2] GAP  facet F07  effort M
- Legacy: LFE/components/admin/projects/WorkspaceSprintsEditor.jsx:63-70 release load failure `Project releases could not be loaded` + Retry
- vNext now: V/components/projects/project-workspace.tsx:816-826 only empty no-sprints copy; data fetch all server
- Fix: Restore release fetch error/retry in section

## G2-7-014-031  [P2] GAP  facet F07  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/sprints.js:118-120 error modal fallback `Failed to update sprints`
- vNext now: V/components/projects/mentor-sprint-write.tsx:55-60 create toast `Could not create sprint`, details edit `Sprint update failed`
- Fix: Map save error wording and preserve 409 conflict details

## G2-7-014-032  [P2] GAP  facet F07  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/sprints.js:150-171 workspace load Error Alert + Retry + not-found
- vNext now: V/components/projects/admin-project-section-page.tsx:38-47 server-await error handling outside section
- Fix: Create contextual error boundary and Retry

## G2-7-014-033  [P2] GAP  facet F08  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/sprints.js:90-93,110-112 `No changes to save` and `Sprints updated`
- vNext now: V/components/projects/mentor-sprint-write.tsx:54-60 `Sprint created`, details edit:59-67 `Sprint details updated`
- Fix: Restore legacy wording for equivalent plan action

## G2-7-014-034  [P2] GAP  facet F08  effort S
- Legacy: LFE/components/admin/projects/WorkspaceSprintsEditor.jsx:54-78 three info/error/warning alerts for release load states
- vNext now: V/components/projects/project-workspace.tsx:816-826 empty notice, no loading/error release warning
- Fix: Restore all three exact notices and triggers
