# Work packet: edit src/modules/placements/hr-round-editor-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/l14-u025-recruiter-drive.md

## G2-14-025-004  [P1] GAP  facet F01  effort L
- Legacy: RecruiterDriveController.java:117-180 drives/rounds/applicants/pipeline/ZIP/results/slots/selections
- vNext now: src/modules/placements/hr-job-read-service.ts:14-130 and src/modules/placements/hr-round-editor-service.ts:16-115
- Fix: Maintain explicit contract mapping for each named drive action.
