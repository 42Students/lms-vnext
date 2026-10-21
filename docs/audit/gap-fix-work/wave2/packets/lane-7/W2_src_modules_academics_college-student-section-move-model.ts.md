# Work packet (wave 2): edit src/modules/academics/college-student-section-move-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u027-learner-controller.md

## G2-5-027-027  [P2] GAP  facet F06  effort M
- Legacy: Legacy class move body only targetClassId positive integer. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LearnerClassMoveDTO.java:12-16`
- vNext now: vNext move requires sectionId UUID, expectedSectionEnrollmentId and confirm true. `src/modules/academics/college-student-section-move-model.ts:3-8`, `src/components/college/student-class-move-action.tsx:49-62`
- Fix: Adapt class move client to optimistic token and explicit confirmation.

## G2-5-027-072  [P2] GAP  facet F18  effort M
- Legacy: Legacy successful move `Learner moved successfully`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:1045-1048`
- vNext now: vNext confirmation names old/new class and irreversible move. `src/modules/academics/college-student-section-move-model.ts:14-16`, `src/components/college/student-class-move-action.tsx:77-99`
- Fix: Use legacy success toast with separate caution text.
