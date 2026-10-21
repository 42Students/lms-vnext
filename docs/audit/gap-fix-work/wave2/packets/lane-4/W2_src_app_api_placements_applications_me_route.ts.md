# Work packet (wave 2): edit src/app/api/placements/applications/me/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/job-controller.md

## G2-6-027-001  [P2] GAP  facet F01  effort M
- Legacy: Controller groups GET/POST jobs, applications, saved and calendar under /api/v1/jobs (JobController.java:54,108-112,398-405,906-912).
- vNext now: vNext splits into /api/placements/jobs/me, /jobs/{jobId}/applications, /applications/me, /learner/saved-jobs, /offers/{offerId}/actions (jobs/me/route.ts:8-14; jobs/[jobId]/applications/route.ts:16-56; applications/me/route.ts:8-13).
- Fix: Document endpoint-by-endpoint route/shape crosswalk and adapt all consumers, redirects and deep links.
