# Work packet (wave 3): edit src/modules/placements/tpo-academic-import-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u022-tpo-student-controller.md

## G2-5-022-051  [P1] MISSING  facet F23  effort L
- Legacy: Legacy one-record verified academic correction may update all independent fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoStudentService.java:43-61`
- vNext now: New bulk academic import overwrites only known subset CGPA/backlogs `src/modules/placements/tpo-academic-import-service.ts:125-159`
- Fix: Rebuild single-record full-field correction or approved retirement.
