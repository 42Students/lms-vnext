# Work packet (wave 3): edit src/modules/placements/hr-job-read-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/recruiter-drives-jobid.md

## G2-11-002-094  [P0] MISSING  facet F22  effort L
- Legacy: Backend POST selection list `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterDriveController.java:178`
- vNext now: VNext only reads selection ledger `src/modules/placements/hr-job-read-service.ts:182`
- Fix: Implement selection write
