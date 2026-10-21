# Work packet: edit src/components/college/student-class-move-action.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u027-learner-controller.md

## G2-5-027-037  [P2] GAP  facet F08  effort M
- Legacy: Legacy move success `Learner moved successfully`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:1036-1048`
- vNext now: vNext dialog confirms `Move name to section? ... cannot be undone automatically`, success route differs. `src/modules/academics/college-student-section-move-model.ts:14-16`, `src/components/college/student-class-move-action.tsx:77-99`
- Fix: Match success copy and clear destination/past class.
