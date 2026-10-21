# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/u015-college-admin-workspace-summary.md (part 1 of 2)

20 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u015-college-admin-workspace-summary.md

## G2-7-015-004  [P1] MISSING  facet F01  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:285-307 `?openTemplate=1` opens attach modal only when no template, then shallow removes query
- vNext now: V/components/projects/admin-project-section-page.tsx:19-77 only understands from/reason; no openTemplate
- Fix: Implement attach-template deep link and safe, cleaned query

## G2-7-015-005  [P1] GAP  facet F02  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:474-500 header actions Change template…, Archive, Delete
- vNext now: V/components/projects/project-workspace.tsx:178-210 renders status plus Archive/Restore only
- Fix: Expose template attachment and recoverable Delete with proper guard

## G2-7-015-006  [P1] GAP  facet F02  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:541-569 snapshot then at-risk alert and linked reason alert
- vNext now: V/components/projects/project-workspace.tsx:362-416 summary editor then metric strip; no matching snapshot/risk sections
- Fix: Rebuild read-first snapshot and source-risk banners before editor

## G2-7-015-007  [P1] GAP  facet F02  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:572-734 full Workspace settings Card, Basic info, Status, Schedule & setup, Overview cross-link
- vNext now: V/components/projects/college-project-summary-editor-full.tsx:67-111 collapsed inline form behind `Edit workspace summary`
- Fix: Make full editor visible in correct Card/section order

## G2-7-015-012  [P1] GAP  facet F03  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:474-500 Change template…, Archive, Delete action buttons
- vNext now: V/components/projects/project-archive-control.tsx:107-134 only Archive button or Restore
- Fix: Add template change and soft delete actions

## G2-7-015-014  [P1] GAP  facet F04  effort M
- Legacy: LFE/components/admin/projects/WorkspaceSummarySnapshot.jsx:48-52 derived progress = rounded(doneTasks+doneSprints)/(totalTasks+totalSprints), fall back stored progress
- vNext now: V/components/projects/project-workspace.tsx:365-405 no combined percent; college summary editor shows persisted progressPercent
- Fix: Compute legacy progress in snapshot independently of hand-set percent

## G2-7-015-023  [P1] GAP  facet F06  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:66-85,588-591 status options ACTIVE,IN_PROGRESS,READY,BLOCKED,ARCHIVED disabled
- vNext now: V/components/projects/college-project-summary-editor-full.tsx:73-76 PLANNED/ACTIVE/COMPLETED based on current status
- Fix: Define lifecycle migration mapping; preserve legacy status meanings and invalid state warning

## G2-7-015-024  [P1] GAP  facet F06  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:595-609 Progress % read-only derived when tasks or sprints exist, else InputNumber 0–100
- vNext now: V/components/projects/college-project-summary-editor-full.tsx:78-79 always number input 0–100
- Fix: Disable manual progress editing while derived progress exists

## G2-7-015-028  [P1] GAP  facet F06  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:681-691 sprintLengthWeeks min1 max12, descriptive extra
- vNext now: V/components/projects/college-project-summary-editor-full.tsx:91-92 min1 max104 and no helper
- Fix: Enforce legacy max12 or document deliberate expanded range

## G2-7-015-029  [P1] GAP  facet F06  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:695-711 estimationUnit POINTS/HOURS and warning about existing estimates
- vNext now: V/components/projects/college-project-summary-editor-full.tsx:93-96 supports POINTS/HOURS/TASKS
- Fix: Remove or justify TASKS; add estimated-task change guard

## G2-7-015-030  [P1] GAP  facet F06  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:316-356 sends only touched fields, classId 0 means detach
- vNext now: V/components/projects/college-project-summary-editor-full.tsx:46-57 always sends all values and sectionId null
- Fix: Implement dirty-field-only PATCH or robust full-state CAS with selective updates

## G2-7-015-035  [P1] GAP  facet F07  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:348-354 changing estimation unit with existing estimates shows exact count warning
- vNext now: V/modules/projects/college-project-summary-service.ts:53-61 persists estimationUnit without same estimated task count condition
- Fix: Block mixed-unit history when existing task estimates present

## G2-7-015-042  [P1] GAP  facet F09  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:479-500 Archive/Delete Popconfirms exact actions and descriptions
- vNext now: V/components/projects/project-archive-control.tsx:107-134 Archive Dialog; no recoverable Delete dialog
- Fix: Restore two distinct confirmations, target Deleted workspaces on delete

## G2-7-015-044  [P1] GAP  facet F09  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:312-362 unsaved edits guarded across tabs
- vNext now: V/components/projects/college-project-summary-editor-full.tsx:68-70,106-107 collapsible Cancel no dirty confirmation
- Fix: Add dirty guard for Cancel, Back, tabs and reload

## G2-7-015-046  [P1] GAP  facet F10  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:316-357 PUT updateProject only touched scalar fields + detailsToken
- vNext now: V/app/api/projects/[projectId]/route.ts:35-42 PATCH full payload with 4 expected fields and expectedUpdatedAt
- Fix: Map selective-update and version/merge semantics

## G2-7-015-048  [P1] GAP  facet F10  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:390-423 archiveProject and deleteProject separate API operations
- vNext now: V/components/projects/project-archive-control.tsx:29-79 POST archive/restore only
- Fix: Expose recoverable delete endpoint and route to Deleted workspaces

## G2-7-015-052  [P1] GAP  facet F12  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:66-85 statuses ACTIVE/IN_PROGRESS/READY/BLOCKED + archived displayed disabled
- vNext now: V/modules/projects/college-project-summary-model.ts:27-35 strictly PLANNED/ACTIVE/COMPLETED
- Fix: Define status migration (READY/BLOCKED/IN_PROGRESS) and preserve lifecycle meaning

## G2-7-015-054  [P1] GAP  facet F12  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:341-354 changing estimation unit disallowed with any task estimate
- vNext now: V/modules/projects/college-project-summary-service.ts:53-61 no estimate check
- Fix: Reject conversion with existing estimated tasks

## G2-7-015-055  [P1] GAP  facet F12  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:595-608 hand progress only when no tasks/sprints
- vNext now: V/modules/projects/college-project-summary-model.ts:8 accepts progressPercent always
- Fix: Compute derived server/display, lock manual override with work present

## G2-7-015-068  [P1] GAP  facet F17  effort M
- Legacy: LFE/components/admin/projects/useUnsavedFormGuard.js:31-61 warns on tab/Back/beforeunload
- vNext now: V/components/projects/college-project-summary-editor-full.tsx:68-70,106-107 Cancel closes unsafely
- Fix: Implement keyboard/click/tab dirty guard
