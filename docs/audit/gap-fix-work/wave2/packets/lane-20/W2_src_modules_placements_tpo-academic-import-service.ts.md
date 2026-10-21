# Work packet (wave 2): edit src/modules/placements/tpo-academic-import-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/tpo-students.md

## G2-14-001-040  [P2] GAP  facet F10  effort M
- Legacy: Legacy import skips unchanged rows; vNext upserts matched even if equal — `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoStudentsReadService.java:593-607`
- vNext now: `src/modules/placements/tpo-academic-import-service.ts:115-149`
- Fix: Compute changed fields, omit unchanged audit/writes

## G2-14-001-073  [P2] GAP  facet F22  effort L
- Legacy: Legacy learner_academic_record with marks and import batch; vNext placement_candidate_academic_evidence importer only CGPA/backlogs — `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoStudentsReadService.java:538-560,593-607`
- vNext now: `src/modules/placements/tpo-academic-import-service.ts:42-58,128-149`
- Fix: Extend academic evidence schema and origin metadata to represent all legacy inputs
