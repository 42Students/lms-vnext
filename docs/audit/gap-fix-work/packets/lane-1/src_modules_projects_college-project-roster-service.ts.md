# Work packet: edit src/modules/projects/college-project-roster-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-project-controller.md, docs/audit/gap2/lane-8/l12-u028-superadmin-project-team.md

## G2-2-020-040  [P1] GAP  facet F10  effort M
- Legacy: AdminProjectController.java:527-553 assigns learners without replacing whole roster
- vNext now: src/modules/projects/college-project-roster-service.ts:14-100 replaces full roster
- Fix: Offer additive membership mode; prevent accidental removal of existing members.

## G2-12-028-054  [P1] GAP  facet F22  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:227-278 learner roster and mentor mutation stored per workspace; docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/AdminProjectLearnerAssignDTO.java:14-17 allows 500
- vNext now: src/modules/projects/college-project-roster-service.ts:74-101 temporal membership soft end, CAS version and per-member notifications; src/modules/projects/college-project-roster-model.ts:3 max100
- Fix: Align max capacity and retain event/audit history for add/remove
