# Work packet (wave 2): edit src/app/api/placements/college/jobs/[jobId]/applications/[applicationId]/rescreen/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-job-controller.md

## G2-2-016-155  [P2] GAP  facet F21  effort M
- Legacy: Feature gate may consult service and optional screening integration `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:58-72`
- vNext now: New screening routed through own service and same-origin guard `src/app/api/placements/college/jobs/[jobId]/applications/[applicationId]/rescreen/route.ts:8-17`
- Fix: Map screening provider availability and disabled-module errors
