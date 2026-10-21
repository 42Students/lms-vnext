# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/u018-college-admin-deleted-workspaces.md (part 1 of 2)

20 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u018-college-admin-deleted-workspaces.md

## G2-7-018-005  [P1] MISSING  facet F02  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:160-175 header with Back action, then error alert, then Card Deleted workspaces
- vNext now: V/app/(authenticated)/college/projects/page.tsx:109-141 main list header, collapsible tools, filters, tabs
- Fix: Create standalone deleted list anatomy rather than showing active list

## G2-7-018-006  [P1] MISSING  facet F02  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:175-207 Card contains Skeleton, failure fallback, deleted table or Empty
- vNext now: V/app/(authenticated)/college/projects/page.tsx:127-155 tabbed cards/table and active list, no deleted-table component
- Fix: Build page Card and conditionally render states

## G2-7-018-008  [P1] MISSING  facet F03  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:106-137 each row Workspace, Mentor and Restore action with UndoOutlined
- vNext now: V/components/projects/project-admin-workspace-list.tsx:1-240 active/archive workspace list, no deleted Restore row
- Fix: Recreate 3 columns and Undo icon/button

## G2-7-018-009  [P1] GAP  facet F03  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:125-133 per-row Popconfirm Restore this workspace? with conditional description
- vNext now: V/components/projects/project-archive-control.tsx:81-104 Restore dialog only on archived detail, no deleted-list action
- Fix: Offer per-deleted-row restore with content-preservation warning

## G2-7-018-012  [P1] GAP  facet F04  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:50-54 page records from API pageData.records and totalRecords
- vNext now: V/modules/projects/admin-insights-service.ts:1-80 lists project snapshot statuses for active/ARCHIVED, no deleted model
- Fix: Implement deleted page projection and true total count from soft-deleted records

## G2-7-018-015  [P1] GAP  facet F04  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:82-103 restore checks returned status BLOCKED + mentor blocker
- vNext now: V/modules/projects/instance-restore-service.ts:31-42 refuses restoration without active primary mentor
- Fix: Reproduce mentorless restore as recoverable BLOCKED instead of hard failure, or flag deliberate stronger policy

## G2-7-018-016  [P1] GAP  facet F04  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:127-128 recoverableContent controls warning for full vs partial restoration
- vNext now: V/db/schema/projects.ts:172-264 no recoverableContent on projectInstances; archived timestamp only
- Fix: Track legacy recoverability and warn when old edits not recoverable

## G2-7-018-021  [P1] MISSING  facet F05  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:55-59 auto page-- when last restored row leaves nonfirst page empty but total>0
- vNext now: V/app/(authenticated)/college/projects/page.tsx:149-155 no deleted-list boundary logic
- Fix: Implement post-restore page correction to prevent false empty page

## G2-7-018-027  [P1] GAP  facet F07  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:127-128 older records partial restore warning based on recoverableContent
- vNext now: V/components/projects/project-archive-control.tsx:90-100 always promises full members/tasks/resources restore
- Fix: Condition restore confirmation on actual recoverable snapshot ability

## G2-7-018-029  [P1] GAP  facet F08  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:93-101 success Workspace restored; mentorless warning Workspace restored, but its mentor could not be recovered — assign one to reactivate it.
- vNext now: V/components/projects/project-archive-control.tsx:60-76 Workspace restored or Failed to restore workspace; mentorless cannot succeed
- Fix: Preserve mentorless warning and restoration outcome handling

## G2-7-018-033  [P1] GAP  facet F09  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:126-128 conditional full/partial description
- vNext now: V/components/projects/project-archive-control.tsx:91-100 unconditional full restore description
- Fix: Provide partial legacy recovery warning and preserve user choice

## G2-7-018-036  [P1] GAP  facet F10  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:81-85 POST restoreProject/:slug/restore?collegeId AdminService.js:380-387
- vNext now: V/app/api/projects/[projectId]/restore/route.ts:1-32 POST restore with expectedUpdatedAt, only archived instances
- Fix: Differentiate soft-delete restore from archive restore, supply correct concurrency token

## G2-7-018-038  [P1] GAP  facet F10  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:87-95 restore may rehydrate prior task/sprint/resource/member state
- vNext now: V/modules/projects/instance-restore-service.ts:48-54 only sets archivedAt=null and status on projectInstances
- Fix: Restore soft-deleted child records where applicable; migration/recoverability indicator

## G2-7-018-041  [P1] GAP  facet F12  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:19-21 deleted workspaces soft-deleted, absent from ordinary list but recoverable
- vNext now: V/db/schema/projects.ts:172-264 only status ARCHIVED/archivedAt; no isDeleted project column
- Fix: Represent separate soft deletion from archived status or explicitly merge with migration semantics

## G2-7-018-042  [P1] GAP  facet F12  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:127-128 recoverableContent false implies shell/eligible members/meetings only
- vNext now: V/modules/projects/instance-restore-service.ts:48-54 leaves all child tables untouched
- Fix: Implement content-preserving vs legacy partial recovery behavior

## G2-7-018-043  [P1] GAP  facet F12  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:87-95 mentorless deleted restore allowed but BLOCKED
- vNext now: V/modules/projects/instance-restore-service.ts:33-42 requires active primary Mentor, otherwise invalid state
- Fix: Support mentorless blocked restore or mark policy change and give recovery path

## G2-7-018-060  [P1] GAP  facet F19  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:47-59 GET paginated on server, page size 20
- vNext now: V/app/(authenticated)/college/projects/page.tsx:59-70 listProjectAdminSnapshots paged but not deleted
- Fix: Implement efficient tenant-indexed deleted count and list

## G2-7-018-064  [P1] GAP  facet F20  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:81-100 restore response may indicate BLOCKED mentorless
- vNext now: V/modules/projects/instance-restore-service.ts:31-42 rejects without active mentor
- Fix: Decide mentorless recovery state transition explicitly

## G2-7-018-066  [P1] GAP  facet F22  effort L
- Legacy: LBE/model/ProjectWorkspace.java:15-20,93-105 workspace has is_deleted via BaseModel and recoverableContent boolean
- vNext now: V/db/schema/projects.ts:172-264 projectInstances has ARCHIVED/archived_at but no deletedAt or recoverableContent
- Fix: Add explicit deleted state and recoverable-content marker or proven migration plan

## G2-7-018-067  [P1] GAP  facet F22  effort L
- Legacy: LBE/dto/projects/ProjectWorkspaceDTO.java:9-25,43-55 includes numericId, slug, mentor, recoverableContent
- vNext now: V/db/schema/projects.ts:172-264 UUID and relational members; project-admin list projections omit deleted metadata
- Fix: Map legacy identifiers, mentor and recoverable snapshot into deleted DTO
