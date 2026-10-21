# Work packet (wave 2): edit src/components/tpo/tpo-debar-control.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u022-tpo-student-controller.md

## G2-5-022-042  [P2] GAP  facet F18  effort S
- Legacy: Legacy method labels upsert academic, debar, lift `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentController.java:50-88`
- vNext now: New UI distinguishes Debar-labelled participation override and timed debar with disclaimer `src/components/tpo/tpo-debar-control.tsx:67-100`
- Fix: Avoid conflating manual debarment with learner-level eligibility override in wording.
