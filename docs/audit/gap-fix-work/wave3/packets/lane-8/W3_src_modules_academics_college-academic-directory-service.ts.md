# Work packet (wave 3): edit src/modules/academics/college-academic-directory-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/batch-search-controller.md

## G2-6-014-014  [P1] MISSING  facet F10  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/batches/BatchSearchController.java:194-210`
- vNext now: `src/modules/academics/college-academic-directory-service.ts:141-205`
- Fix: Restore usage selection telemetry if required for popular ordering

## G2-6-014-029  [P1] MISSING  facet F21  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/batches/BatchSearchController.java:194-210`
- vNext now: `src/modules/academics/college-academic-directory-service.ts:141-205`
- Fix: Determine downstream popularity telemetry consumers and reintroduce when required
