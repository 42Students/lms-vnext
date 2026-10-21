# Work packet: edit src/modules/placements/tpo-student-notes-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/tpo-students-hub-controller.md

## G2-4-022-028  [P3] GAP  facet F08  effort S
- Legacy: Legacy addNote returns {ok:true}. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:71-75`)
- vNext now: New notes service responds added/skipped with details, different envelope. (`src/modules/placements/tpo-student-notes-service.ts:16-52`)
- Fix: Adapt success message to older client if needed.
