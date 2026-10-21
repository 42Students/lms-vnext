# Work packet (wave 2): edit src/modules/placements/tpo-applicant-pipeline-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/job-application-search-cache.md

## G2-13-014-017  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:59-61` limit default15 without max/min validation
- vNext now: `src/modules/placements/tpo-applicant-pipeline-model.ts:2-12` restricts search <=100, page int1..100000, fixed pageSize25
- Fix: Publish separate autocomplete cap and pagination config; reject invalid limit inputs explicitly
