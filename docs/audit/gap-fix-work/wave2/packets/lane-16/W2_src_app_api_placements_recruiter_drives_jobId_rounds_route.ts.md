# Work packet (wave 2): edit src/app/api/placements/recruiter/drives/[jobId]/rounds/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/l14-u025-recruiter-drive.md

## G2-14-025-001  [P2] GAP  facet F01  effort M
- Legacy: RecruiterDriveController.java:23-25 /api/v1/recruiter/colleges/{collegeId}
- vNext now: src/app/api/placements/recruiter/drives/[jobId]/rounds/route.ts:9-39 UUID job route
- Fix: Map old selected college and job IDs into active recruiter grant.

## G2-14-025-051  [P3] GAP  facet F18  effort S
- Legacy: RecruiterDriveController.java:205-209 'this drive is over' business conflict
- vNext now: src/app/api/placements/recruiter/drives/[jobId]/rounds/route.ts:33 machine 409
- Fix: Map human state-specific errors.
