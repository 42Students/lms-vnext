# Work packet: edit src/modules/projects/member-service.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u004-learner-projects.md, docs/audit/gap2/lane-3/l18-u017-project-member-entity.md, docs/audit/gap2/lane-5/u028-superadmin-projects-section.md

## G2-15-004-039  [P1] GAP  facet F10  effort L
- Legacy: Legacy GET `/api/v1/projects/me/page` with page0,size25,search,status,attention returns records+totalRecords (projectService.js:6-13; ProjectWorkspaceController.java:91-101; ProjectsContent.jsx:205-214)
- vNext now: VNext DB listMyProjectInstances and team/progress/due/attention in multiple read calls, then local slice (learn/projects/page.tsx:78-140; member-service.ts:943-991)
- Fix: Implement bounded DB-level pagination and equivalent filter contract

## G2-18-017-019  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:14-16`
- vNext now: `src/modules/projects/member-service.ts:689-746`
- Fix: Legacy revive deleted row instead of insert due hard unique triple; vNext add inserts new row after previous endedAt.

## G2-5-028-045  [P1] GAP  facet F10  effort M
- Legacy: Legacy `/projectId/learners` supports replaceExisting and roleLabel. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:331-369`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectController.java:527-553`
- vNext now: vNext members created/ended separately using project membership IDs. `src/modules/projects/member-service.ts:69-119`
- Fix: Build bulk replace endpoint with transaction and impacted list.

## G2-5-028-051  [P1] GAP  facet F12  effort M
- Legacy: Legacy replaceExisting removes learners not in new list only after confirmation. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:299-328`
- vNext now: vNext membership mutation model distinct, bulk replacement not present. `src/modules/projects/member-service.ts:69-119`
- Fix: Retain explicit destructive replacement and notification event.

## G2-18-017-013  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:41-47`
- vNext now: `src/modules/projects/member-service.ts:54-66`
- Fix: Legacy optimistic JPA version conflict vs mapped PROJECT_MEMBER_CONFLICT/PRIMARY_MENTOR_CONFLICT.

## G2-18-017-014  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:35-39`
- vNext now: `src/modules/projects/member-service.ts:107-117`
- Fix: Legacy memberStatus string, vNext inactive/cross-college membership denied with explicit codes.

## G2-18-017-015  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:41-47`
- vNext now: `src/modules/projects/member-service.ts:717-743`
- Fix: Legacy BaseModel persistence status and version managed by JPA, new add returns typed member+audit event/notification.

## G2-18-017-016  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:38-39`
- vNext now: `src/modules/projects/member-service.ts:862-881`
- Fix: Legacy workspace soft delete can reactivate a member row, vNext end action records endedAt and audit.

## G2-5-028-033  [P2] GAP  facet F08  effort M
- Legacy: Legacy mentor success `Mentor assigned successfully`; learner success `Learners assigned successfully`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:282-285,355-358`
- vNext now: vNext team actions not inline; list offers no matching toast. `src/modules/projects/member-service.ts:69-119`, `src/components/projects/project-admin-workspace-list.tsx:101-107`
- Fix: Keep exact success messaging with list refresh.
