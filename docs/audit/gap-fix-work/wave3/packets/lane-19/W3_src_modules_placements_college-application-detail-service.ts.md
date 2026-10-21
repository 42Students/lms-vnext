# Work packet (wave 3): edit src/modules/placements/college-application-detail-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-job-controller.md

## G2-2-016-118  [P1] MISSING  facet F10  effort L
- Legacy: GET per-learner placement summary across all jobs and next interview `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:997-1016`
- vNext now: Mapped applicant detail is job-specific and does not aggregate other jobs `src/modules/placements/college-application-detail-service.ts:24-47`
- Fix: Provide tenant-safe all-job learner placement summary with next-interview per app
