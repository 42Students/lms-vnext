# Work packet (wave 2): edit src/app/api/placements/applications/[applicationId]/actions/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/job-service-impl.md, docs/audit/gap2/lane-6/job-controller.md

## G2-18-011-023  [P2] GAP  facet F06  effort M
- Legacy: Legacy learner withdrawal by jobId or applicationId (`JobServiceImpl.java:963-977`).
- vNext now: New POST `/api/placements/applications/{uuid}/actions` with reason required by route (`applications/[applicationId]/actions/route.ts:14-35`; `application-service.ts:1094-1103`).
- Fix: Support existing jobId deep links while mandating audit reason in new form.

## G2-6-027-051  [P2] GAP  facet F18  effort S
- Legacy: Legacy error 'Failed to withdraw. Please try again or contact support.' and withdrawal rate copy (JobController.java:645-684).
- vNext now: vNext typed JSON error response with explicit withdrawal reason validation (learner-withdrawal-model.ts:5-15; applications/[applicationId]/actions/route.ts:28-37).
- Fix: Match error placement and literal wording; retain validation details per field.
