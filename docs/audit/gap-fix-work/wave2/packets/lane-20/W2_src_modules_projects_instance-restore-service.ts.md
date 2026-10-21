# Work packet (wave 2): edit src/modules/projects/instance-restore-service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l11-u028-superadmin-deleted-workspaces.md, docs/audit/gap2/lane-3/l18-u017-project-member-entity.md

## G2-11-028-039  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectController.java:345-355`
- vNext now: `src/modules/projects/instance-restore-service.ts:15-31`
- Fix: Legacy selected collegeId numeric verifies admin action/flag; vNext requireProjectManageAccess + module enabled + persisted platform permission and UUID scope.

## G2-11-028-040  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:69-92`
- vNext now: `src/modules/projects/instance-restore-service.ts:32-42`
- Fix: Legacy deleted workspace may lack former mentor; vNext requires a current active college mentor and primary projectMembers role before restore.

## G2-11-028-050  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:69-92`
- vNext now: `src/modules/projects/instance-restore-service.ts:55-75`
- Fix: Legacy restore toast but side effects depend backend service; vNext explicitly notifies active learners/mentors on restore, verify expected recipients and opt-out.

## G2-11-028-062  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:44-52`
- vNext now: `src/modules/projects/instance-restore-service.ts:31-54`
- Fix: Legacy mounted flag ignores outdated fetch on unmount but not sibling overlapping request/page transitions; vNext SQL request isolation and optimistic updatedAt CAS.

## G2-11-028-068  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:70-75`
- vNext now: `src/modules/projects/instance-restore-service.ts:33-54`
- Fix: Legacy recovery can reinstate mentor-less BLOCKED state; vNext project_instances status constraint forbids BLOCKED, requiring separate readiness blocker flags.

## G2-18-017-006  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:38-39`
- vNext now: `src/modules/projects/instance-restore-service.ts:33-42`
- Fix: Legacy deletedByWorkspace recoverability marker absent new table; restore checks current primary mentor instead.

## G2-18-017-028  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:38-39`
- vNext now: `src/modules/projects/instance-restore-service.ts:33-42`
- Fix: Legacy workspace restore can revive removed-by-workspace members; new archive restore requires active primary mentor, refuses mentorless project.
