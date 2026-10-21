# Work packet: edit src/modules/placements/tpo-applicant-pipeline-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/job-application-search-cache.md

## G2-13-014-011  [P1] GAP  facet F04  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:81-90` app.applicationStatus includes APPLIED,SHORTLISTED,etc from `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-30`
- vNext now: `src/modules/placements/tpo-applicant-pipeline-service.ts:129` status SUBMITTED/WITHDRAWN; screening status separately; `src/modules/placements/tpo-applicant-pipeline-model.ts:23-27` derives effective stage
- Fix: Provide explicit state mapping including legacy OFFERED/HIRED/ASSESSMENT/INTERVIEW statuses from other stage tables
