# Work packet: edit src/app/api/placements/jobs/[jobId]/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/placement-job-service.md

## G2-17-012-030  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:347-368 — Legacy DELETE /{jobId} soft deletes org-wide job.
- vNext now: src/app/api/placements/jobs/[jobId]/route.ts:51-65 — vNext DELETE invokes archive through college scope.
- Fix: Honor authorized organization-wide archive for collegeId-null jobs.
