# Work packet (wave 2): edit src/modules/academics/college-student-section-move-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u027-learner-controller.md

## G2-5-027-006  [P2] GAP  facet F01  effort M
- Legacy: Legacy learner same-batch class move, general update and delete endpoints. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:1005-1143`
- vNext now: vNext dedicated section move; identity/profile account changes routed through other people services. `src/modules/academics/college-student-section-move-service.ts:94-175`, `src/components/college/student-class-move-action.tsx:18-105`
- Fix: Link old update/delete to membership/profile lifecycle and preserve move transaction semantics.

## G2-5-027-046  [P2] GAP  facet F10  effort M
- Legacy: Legacy move calls learnerService.moveLearnerToClass and audits transfer. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:1005-1063`
- vNext now: vNext ends current enrollment MOVED, creates replacement, logs activity. `src/modules/academics/college-student-section-move-service.ts:118-175`
- Fix: Map numeric currentClass to historic section enrollment; preserve transfer history.

## G2-5-027-064  [P2] GAP  facet F15  effort M
- Legacy: Legacy create/move logged AdminAuditLog rows. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:380-385,1041-1048`
- vNext now: vNext identity runtime and activity for move; registration audit spans multiple writes. `src/modules/people/college-student-registration-service.ts:38-93`, `src/modules/academics/college-student-section-move-service.ts:166-175`
- Fix: Unify history around membership and enrollment IDs.
