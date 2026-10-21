# Work packet: edit src/modules/placements/tpo-academic-import-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u022-tpo-student-controller.md

## G2-5-022-013  [P1] GAP  facet F06  effort M
- Legacy: Legacy academic upsert `PUT /{learnerId}/academic-record` raw incoming entity `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentController.java:50-57`
- vNext now: VNext academic import accepts 1..200 rows validated preview/commit `src/modules/placements/tpo-academic-import-service.ts:17-31,64-111`
- Fix: Add single-record TPO correction route or use one-row preview+commit.

## G2-5-022-014  [P1] GAP  facet F06  effort L
- Legacy: Legacy upsert updates only nonnull provided academic fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoStudentService.java:45-61`
- vNext now: VNext import overwrites CGPA/activeBacklogs, not full legacy fields `src/modules/placements/tpo-academic-import-service.ts:112-158`
- Fix: Implement partial field merge for all legacy verified evidence fields.

## G2-5-022-026  [P1] GAP  facet F10  effort M
- Legacy: Legacy upsert sets source VERIFIED, importedAt now, importBatchId null `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoStudentService.java:43-61`
- vNext now: VNext evidence update source VERIFIED/verifiedAt plus activity and eligibility recheck `src/modules/placements/tpo-academic-import-service.ts:125-190`
- Fix: Match single-edit provenance; safely re-evaluate all existing applications.

## G2-5-022-033  [P1] GAP  facet F12  effort M
- Legacy: Legacy verified source wins over self-reported academic `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:13-22,65-78`
- vNext now: VNext persisted verified academic evidence and profile verified separate `src/modules/placements/tpo-academic-import-service.ts:125-158`
- Fix: Document conflict order for imported/verified/self values.
