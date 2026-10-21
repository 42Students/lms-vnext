# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/u017-college-admin-workspace-team.md (part 1 of 2)

20 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u017-college-admin-workspace-team.md

## G2-7-017-005  [P1] GAP  facet F02  effort M
- Legacy: LFE/components/admin/projects/WorkspaceTeamOverview.jsx:51-76 Team at a glance Card, intro, four metrics
- vNext now: V/components/projects/project-workspace.tsx:682-709 heading Project people, action buttons and no summary Card
- Fix: Rebuild introductory Team at a glance summary before roster

## G2-7-017-006  [P1] MISSING  facet F02  effort S
- Legacy: LFE/components/admin/projects/WorkspaceTeamOverview.jsx:78-85 no-primary-mentor warning
- vNext now: V/components/projects/project-workspace.tsx:711-715 mentor-only no-primary-mentor text; admin sees no warning
- Fix: Show warning to admin when no primary mentor

## G2-7-017-007  [P1] GAP  facet F02  effort L
- Legacy: LFE/components/admin/projects/WorkspaceTeamOverview.jsx:88-100 TeamGroupNotice then Team roster Card with table
- vNext now: V/components/projects/project-workspace.tsx:725-799 group text paragraph then member article cards
- Fix: Rebuild team-group alert and role/activity roster table

## G2-7-017-012  [P1] MISSING  facet F03  effort M
- Legacy: LFE/components/admin/projects/workspaceRowMeta.jsx:168-175 Check roster button only for group workspace
- vNext now: V/components/projects/project-workspace.tsx:725-730 passive group note no Check roster action
- Fix: Add authorized manual team reconciliation action

## G2-7-017-014  [P1] GAP  facet F04  effort M
- Legacy: LFE/components/admin/projects/WorkspaceTeamOverview.jsx:24-32 Task coverage counts distinct learner IDs whose task.assigneeId present
- vNext now: V/components/projects/project-workspace.tsx:1015-1021 assigneeMembershipId on task, no Team coverage metric
- Fix: Join task assignee memberships and calculate distinct assigned learners

## G2-7-017-016  [P1] GAP  facet F04  effort M
- Legacy: LFE/components/admin/projects/workspaceRowMeta.jsx:61-77 task aggregates assigned, done, review, in progress, latest submittedAt/updatedAt by userId
- vNext now: V/components/projects/project-workspace.tsx:757-799 member cards omit work aggregates
- Fix: Derive per-member status metrics and latest task activity timestamp

## G2-7-017-019  [P1] MISSING  facet F05  effort M
- Legacy: LFE/components/admin/projects/workspaceRowMeta.jsx:50-60,80-95 search member name or ID; type All members/Learners/Faculty
- vNext now: V/components/projects/project-workspace.tsx:732-799 no search/type filter in member cards
- Fix: Add search by name/member ID and role filter

## G2-7-017-020  [P1] GAP  facet F05  effort M
- Legacy: LFE/components/admin/projects/workspaceRowMeta.jsx:85-86,134-137 pagination 20 rows, only if >20, count range N–M of X matching members
- vNext now: V/components/projects/project-workspace.tsx:757-799 renders every member card at once
- Fix: Restore 20-row paging and page reset on filter

## G2-7-017-021  [P1] GAP  facet F05  effort L
- Legacy: LFE/components/admin/projects/workspaceRowMeta.jsx:104-132 5 columns Member, Role, Tasks assigned, Done · In review · In progress, Last task update
- vNext now: V/components/projects/project-workspace.tsx:764-785 only member name/role/badge
- Fix: Recreate full roster table with five columns

## G2-7-017-025  [P1] GAP  facet F06  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:333-345 mentor warning explains meetings cancellation and task assignment clearing
- vNext now: V/components/projects/college-project-mentor-dialog.tsx:70,92 generic may change message
- Fix: Restore explicit guaranteed effects warning and verify service effects

## G2-7-017-027  [P1] GAP  facet F06  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:363-369 students modal defaults replaceExisting false (append)
- vNext now: V/components/projects/college-project-student-roster-dialog.tsx:44-48 seeds full current roster and always Replace roster
- Fix: Offer append mode by default with replace optional; retain explicit full-replace mode

## G2-7-017-029  [P1] MISSING  facet F06  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:437-450 checkbox Replace existing learners and on check seeds current learners
- vNext now: V/components/projects/college-project-student-roster-dialog.tsx:109-123 always replace, no mode checkbox
- Fix: Restore explicit replace toggle with current selection seeding

## G2-7-017-030  [P1] GAP  facet F06  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:404-425 enforces total active <=500, not only selected batch
- vNext now: V/modules/projects/college-project-roster-model.ts:2-7 max100 UUIDs
- Fix: Raise max to supported 500 with server-safe transactional validation

## G2-7-017-034  [P1] GAP  facet F07  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:411-424 500 total validator detailed current/adding counts
- vNext now: V/modules/projects/college-project-roster-model.ts:2-4 max100 generic Zod issue
- Fix: Surface exact count-based 500 limit warning and handle 100+ cases

## G2-7-017-041  [P1] GAP  facet F09  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:257-269 destructive removal confirmation lists affected learner names and prior-work retention
- vNext now: V/components/projects/college-project-student-roster-dialog.tsx:120-123 generic Remove N learner(s), does not name affected learners
- Fix: List removed learners explicitly in confirmation, with full consequence

## G2-7-017-045  [P1] GAP  facet F10  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:253-285 assignProjectLearners POST supports append/replace
- vNext now: V/components/projects/college-project-student-roster-dialog.tsx:62-70 POST /api/projects/:id/roster always full list + expectedUpdatedAt
- Fix: Implement append affordance while preserving atomic replacement

## G2-7-017-050  [P1] GAP  facet F11  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:363-445 Manage students applies to all workspaces including teamGroupId; TeamGroupNotice clarifies synchronization
- vNext now: V/components/projects/project-workspace.tsx:703-709 hides roster editing on group-managed team
- Fix: Document intentional class-team source-of-truth divergence and guide editor to correct screen

## G2-7-017-051  [P1] GAP  facet F12  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:409-424 total learners can reach 500
- vNext now: V/modules/projects/college-project-roster-model.ts:2-7 max100 selected
- Fix: Restore 500 participant cap without request-size risk

## G2-7-017-052  [P1] GAP  facet F12  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:265-282 append is default, replacement only when explicit checkbox selected
- vNext now: V/modules/projects/college-project-roster-service.ts:32-39 computes removals from full selected roster
- Fix: Make default operation additive and preserve existing members

## G2-7-017-058  [P1] GAP  facet F13  effort S
- Legacy: LFE/components/admin/projects/WorkspaceTeamOverview.jsx:78-85 No primary mentor assigned warning
- vNext now: V/components/projects/project-workspace.tsx:711-715 warning only for mentor mode
- Fix: Make warning visible to admin team manager
