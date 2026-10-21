# Work packet (wave 2): edit src/components/college/student-class-move-action.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u027-learner-controller.md

## G2-5-027-006  [P2] GAP  facet F01  effort M
- Legacy: Legacy learner same-batch class move, general update and delete endpoints. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:1005-1143`
- vNext now: vNext dedicated section move; identity/profile account changes routed through other people services. `src/modules/academics/college-student-section-move-service.ts:94-175`, `src/components/college/student-class-move-action.tsx:18-105`
- Fix: Link old update/delete to membership/profile lifecycle and preserve move transaction semantics.

## G2-5-027-027  [P2] GAP  facet F06  effort M
- Legacy: Legacy class move body only targetClassId positive integer. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LearnerClassMoveDTO.java:12-16`
- vNext now: vNext move requires sectionId UUID, expectedSectionEnrollmentId and confirm true. `src/modules/academics/college-student-section-move-model.ts:3-8`, `src/components/college/student-class-move-action.tsx:49-62`
- Fix: Adapt class move client to optimistic token and explicit confirmation.

## G2-5-027-072  [P2] GAP  facet F18  effort M
- Legacy: Legacy successful move `Learner moved successfully`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:1045-1048`
- vNext now: vNext confirmation names old/new class and irreversible move. `src/modules/academics/college-student-section-move-model.ts:14-16`, `src/components/college/student-class-move-action.tsx:77-99`
- Fix: Use legacy success toast with separate caution text.
