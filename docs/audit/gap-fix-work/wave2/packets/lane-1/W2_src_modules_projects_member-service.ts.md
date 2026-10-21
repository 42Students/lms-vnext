# Work packet (wave 2): edit src/modules/projects/member-service.ts

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l18-u017-project-member-entity.md, docs/audit/gap2/lane-5/u028-superadmin-projects-section.md, docs/audit/gap2/lane-7/l17-u031-projects-end-to-end.md

## G2-18-017-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:20-27`
- vNext now: `src/modules/projects/member-service.ts:689-746`
- Fix: Legacy userId/userType direct fields, vNext add through active collegeMembershipId and role.

## G2-18-017-003  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:29-36`
- vNext now: `src/modules/projects/member-service.ts:881-937`
- Fix: Legacy member displayName/roleLabel/status scalar model, vNext join user.displayName and active roleKind/canMutate/isPrimary.

## G2-18-017-004  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:38-47`
- vNext now: `src/modules/projects/member-service.ts:829-881`
- Fix: Legacy soft-delete flag and JPA version, vNext end membership by endedAt and restore only at workspace level.

## G2-18-017-010  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:35-39`
- vNext now: `src/modules/projects/member-service.ts:881-937`
- Fix: Legacy memberStatus may be INVITED or removed; vNext active list is endedAt null, no same invitation status on member row.

## G2-18-017-011  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:26-36`
- vNext now: `src/modules/projects/member-service.ts:689-746`
- Fix: Legacy user_type varchar20 unconstrained Java string, new role enum LEARNER/MENTOR plus roleKind and immutable candidate permissions.

## G2-18-017-018  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:38-47`
- vNext now: `src/modules/projects/member-service.ts:829-881`
- Fix: Member removal confirmation should reflect endedAt rather than isDeleted, and primary mentor safeguards.

## G2-18-017-020  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:38-47`
- vNext now: `src/modules/projects/member-service.ts:829-881`
- Fix: Legacy project workspace deletion remembers deletedByWorkspace, vNext archive does not end memberships; restore not same cascade.

## G2-18-017-021  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:41-47`
- vNext now: `src/modules/projects/member-service.ts:746-829`
- Fix: Legacy JPA @Version auto CAS, vNext update guarded by active row and service logic.

## G2-18-017-027  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:35-39`
- vNext now: `src/modules/projects/member-service.ts:122-145`
- Fix: Legacy soft-deleted membership row may exist while hidden, new loadActiveProjectMember requires endedAt null, 404/error.

## G2-18-017-034  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:29-36`
- vNext now: `src/modules/projects/member-service.ts:881-937`
- Fix: Legacy displayName stored snapshot and role label, new joined name changes if user renamed; screen-reader labels differ.

## G2-18-017-039  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:29-36`
- vNext now: `src/modules/projects/member-service.ts:881-937`
- Fix: Legacy persisted displayName avoids user join; vNext always joins current member and role data.

## G2-18-017-040  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:41-47`
- vNext now: `src/modules/projects/member-service.ts:746-829`
- Fix: Legacy Long @Version can detect stale edits, vNext updatedAt timestamp and scoped active mutation check need race proof.

## G2-18-017-042  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:38-39`
- vNext now: `src/modules/projects/member-service.ts:829-881`
- Fix: Workspace archive/restore and member end/readd can interleave, verify locks preserve active primary mentor.

## G2-5-028-026  [P2] GAP  facet F06  effort M
- Legacy: Legacy existing mentor/learner lists populated from project, defaults replaceExisting:true. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:232-257`
- vNext now: vNext create assigns memberships; replacing allocation happens on team page. `src/components/projects/project-create-control.tsx:43-58`, `src/modules/projects/member-service.ts:69-119`
- Fix: Prepopulate edit dialogs from existing team and preserve replace semantics.

## G2-5-028-044  [P2] GAP  facet F10  effort M
- Legacy: Legacy `/projectId/mentor` assign mentor. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:259-297`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectController.java:392-425`
- vNext now: vNext member-service handles mentor membership operations; not same caller/API. `src/modules/projects/member-service.ts:69-119`
- Fix: Map mentor assignment rights and provide list-action integration.

## G2-17-031-008  [P2] GAP  facet F03  effort M
- Legacy: LBE/controller/ProjectWorkspaceController.java:491-520 meeting Withdraw and Request; 664-699 member Add/Update/Remove.
- vNext now: V/modules/projects/meeting-service.ts:28-40 and member-service.ts:43-52 require typed actions.
- Fix: Inventory meeting and team action labels, icons, helper text and badges.

## G2-18-017-037  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:38-39`
- vNext now: `src/modules/projects/member-service.ts:829-881`
- Fix: Legacy deletedByWorkspace semantics not reflected in new team action labels.
