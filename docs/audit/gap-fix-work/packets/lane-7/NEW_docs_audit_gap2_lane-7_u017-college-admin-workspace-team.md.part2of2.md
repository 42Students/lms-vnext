# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/u017-college-admin-workspace-team.md (part 2 of 2)

12 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u017-college-admin-workspace-team.md

## G2-7-017-073  [P1] GAP  facet F19  effort M
- Legacy: LFE/components/admin/projects/workspaceRowMeta.jsx:50,85-86,134-137 20-row client page and filter before slicing
- vNext now: V/components/projects/project-workspace.tsx:757-799 renders every member
- Fix: Paginate/virtualize large rosters, preserve 20 default

## G2-7-017-077  [P1] GAP  facet F20  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:252-272 remove confirm names exact affected members
- vNext now: V/components/projects/college-project-student-roster-dialog.tsx:120-123 generic count confirmation, no names
- Fix: List removed names and ensure confirmation matches actual selected diff

## G2-7-017-080  [P1] GAP  facet F22  effort L
- Legacy: LBE/model/ProjectMember.java:14-47 project_id, user_id, user_type triple hard unique incl soft-deleted; roleLabel max80 and JPA version
- vNext now: V/db/schema/projects.ts:638-719 UUID college membership FK, active-only uniqueness, roleLabel text, endedAt, roleKind, canMutate
- Fix: Define migration of role labels, historical reactivation and membership identity without duplicates

## G2-7-017-081  [P1] GAP  facet F22  effort M
- Legacy: LBE/dto/projects/AdminProjectLearnerAssignDTO.java:9-18 learnerIds list max500 and replaceExisting default true backend; Team modal sets false default
- vNext now: V/modules/projects/college-project-roster-model.ts:2-8 max100, no append/replace field
- Fix: Align effective form default and endpoint max500, add append semantic option

## G2-7-017-083  [P1] GAP  facet F22  effort M
- Legacy: LFE/components/admin/projects/workspaceRowMeta.jsx:61-77 per-member task assignment aggregates via assigneeId numeric
- vNext now: V/db/schema/projects.ts:430-437 task assigneeMembershipId FK, projectMembers:647-655
- Fix: Map identity join and preserve task coverage/last activity fields

## G2-7-017-085  [P1] GAP  facet F23  effort L
- Legacy: LFE/components/admin/projects/workspaceRowMeta.jsx:147-175 managed group Check roster
- vNext now: V/components/projects/project-workspace.tsx:725-730 removes check and team roster editing
- Fix: Either reinstate authorized group reconciliation or clearly document replacement workflow

## G2-7-017-032  [P2] GAP  facet F07  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:338 required Mentor validation text Mentor is required
- vNext now: V/components/projects/college-project-mentor-dialog.tsx:80-97 Confirm disabled if no mentor but no matching field error
- Fix: Show exact required validation message

## G2-7-017-033  [P2] GAP  facet F07  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:399-416 Students required At least one learner is required
- vNext now: V/components/projects/college-project-student-roster-dialog.tsx:114-115 disabled on no changes, empty roster may be saved if changed
- Fix: Match zero-student requirement or document permitted clearing

## G2-7-017-036  [P2] GAP  facet F07  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:454-478 Workspace could not be loaded and Retry; Workspace not found
- vNext now: V/components/projects/admin-project-section-page.tsx:38-47 server read before component, no in-page Alert
- Fix: Restore scoped load error and not-found recovery

## G2-7-017-037  [P2] GAP  facet F08  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:241-251 Mentor assigned or Failed to assign mentor
- vNext now: V/components/projects/college-project-mentor-dialog.tsx:57-62 Mentor assigned with extra description, failure inline different wording
- Fix: Use legacy text and preserve actionable retry

## G2-7-017-038  [P2] GAP  facet F08  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/team.js:273-285 Learners updated and Failed to update learners
- vNext now: V/components/projects/college-project-student-roster-dialog.tsx:70-79 Learners updated with count or Could not update the roster
- Fix: Map feedback wording and appended vs replacement counts

## G2-7-017-039  [P2] MISSING  facet F08  effort M
- Legacy: LFE/components/admin/projects/workspaceRowMeta.jsx:153-163 Check roster success Fixed N member rows... or already matches..., failure Could not check the roster.
- vNext now: V/components/projects/project-workspace.tsx:725-730 no Check roster action nor toast
- Fix: Restore reconciliation feedback states
