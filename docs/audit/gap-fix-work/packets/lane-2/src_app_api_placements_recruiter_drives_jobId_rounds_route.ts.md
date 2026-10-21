# Work packet: edit src/app/api/placements/recruiter/drives/[jobId]/rounds/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/l14-u025-recruiter-drive.md

## G2-14-025-022  [P2] GAP  facet F07  effort M
- Legacy: RecruiterDriveController.java:205-209 status CONFLICT with human reason
- vNext now: src/app/api/placements/recruiter/drives/[jobId]/rounds/route.ts:32-36 machine STALE_OR_USED_ROUND
- Fix: Show actual settlement/expired-access reason to user.

## G2-14-025-024  [P2] GAP  facet F08  effort M
- Legacy: RecruiterDriveController.java:147-160 round mutations return saved/deleted object
- vNext now: src/app/api/placements/recruiter/drives/[jobId]/rounds/route.ts:25-29 saved/id/action or redirect303
- Fix: Match toast copy, redirect and refresh behavior.
