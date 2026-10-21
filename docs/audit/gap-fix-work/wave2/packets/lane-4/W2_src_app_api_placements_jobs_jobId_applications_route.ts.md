# Work packet (wave 2): edit src/app/api/placements/jobs/[jobId]/applications/route.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l19-u021-apply-to-job-request.md, docs/audit/gap2/lane-6/job-controller.md

## G2-19-021-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:398-405 — POST /api/v1/jobs/{jobId}/apply/{learnerId}
- vNext now: src/app/api/placements/jobs/[jobId]/applications/route.ts:34-55 — POST /api/placements/jobs/{jobId}/applications
- Fix: Map endpoint and derived learner identity

## G2-19-021-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:439-446 — apply returns immediate screening guidance
- vNext now: src/app/api/placements/jobs/[jobId]/applications/route.ts:48-55 — returns application object 201, status SUBMITTED
- Fix: Align confirmation text with new screening pipeline

## G2-19-021-019  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:398-446 — post job/learner, optional body and query param
- vNext now: src/app/api/placements/jobs/[jobId]/applications/route.ts:34-55 — post jobId, required parsed JSON
- Fix: Document body/query transition and 400 for missing JSON

## G2-6-027-001  [P2] GAP  facet F01  effort M
- Legacy: Controller groups GET/POST jobs, applications, saved and calendar under /api/v1/jobs (JobController.java:54,108-112,398-405,906-912).
- vNext now: vNext splits into /api/placements/jobs/me, /jobs/{jobId}/applications, /applications/me, /learner/saved-jobs, /offers/{offerId}/actions (jobs/me/route.ts:8-14; jobs/[jobId]/applications/route.ts:16-56; applications/me/route.ts:8-13).
- Fix: Document endpoint-by-endpoint route/shape crosswalk and adapt all consumers, redirects and deep links.
