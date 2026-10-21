# Work packet: edit src/modules/projects/college-project-roster-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l12-u028-superadmin-project-team.md

## G2-12-028-018  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:437-447 multi Select maxCount 500 and live remote search
- vNext now: src/components/projects/college-project-student-roster-dialog.tsx:90-105 explicit search, checkbox group; src/modules/projects/college-project-roster-model.ts:3-4 max100
- Fix: Raise roster capacity to 500 with virtualized options and correct total cap checks

## G2-12-028-021  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:410-435 required Students and detailed cap error 'This would exceed the 500-learner limit...'
- vNext now: src/modules/projects/college-project-roster-model.ts:2-7 Zod max100 generic; src/components/projects/college-project-student-roster-dialog.tsx:113-116 no inline cap explanation
- Fix: Use 500 effective total cap and legacy computed inline error

## G2-12-028-034  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/AdminProjectLearnerAssignDTO.java:14-17 max500, replaceExisting defaults true in DTO; client default checkbox false
- vNext now: src/modules/projects/college-project-roster-model.ts:2-7 max100 and no append flag
- Fix: Adopt max500 business cap and default-append client behaviour for parity

## G2-12-028-054  [P1] GAP  facet F22  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:227-278 learner roster and mentor mutation stored per workspace; docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/AdminProjectLearnerAssignDTO.java:14-17 allows 500
- vNext now: src/modules/projects/college-project-roster-service.ts:74-101 temporal membership soft end, CAS version and per-member notifications; src/modules/projects/college-project-roster-model.ts:3 max100
- Fix: Align max capacity and retain event/audit history for add/remove
