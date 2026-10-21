# Work packet: edit src/app/api/placements/jobs/[jobId]/applications/route.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l19-u021-apply-to-job-request.md, docs/audit/gap2/lane-6/job-controller.md

## G2-19-021-013  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobServiceImpl.java:404-420 — Resume URL must use HTTPS and must be uploaded under your own profile
- vNext now: src/app/api/placements/jobs/[jobId]/applications/route.ts:45-59 — generic API errors and strict input
- Fix: Expose exact resume ownership/format problem in profile selection UX

## G2-6-027-019  [P2] GAP  facet F07  effort S
- Legacy: Invalid legacy jobId/learnerId returns 400 with 'jobId must be a positive integer' / 'learnerId must be a positive integer' (JobController.java:406-410).
- vNext now: vNext URL is UUID parsed by placementJobIdSchema; JSON error boundary (application-service.ts:575-579; jobs/[jobId]/applications/route.ts:45-59).
- Fix: Show equivalent actionable malformed-link error while validating UUID server side.

## G2-19-021-015  [P3] GAP  facet F08  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:445-446 — 200 success envelope with screening will be completed shortly
- vNext now: src/app/api/placements/jobs/[jobId]/applications/route.ts:53-55 — 201 {application}
- Fix: Map status, body envelope, toast copy

## G2-19-021-016  [P3] GAP  facet F08  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:464-465 — catch-all error Failed to apply. Please try again or contact support.
- vNext now: src/app/api/placements/jobs/[jobId]/applications/route.ts:57-59 — apiErrorResponse domain error
- Fix: Make no-resume/hard-eligibility failure actionable
