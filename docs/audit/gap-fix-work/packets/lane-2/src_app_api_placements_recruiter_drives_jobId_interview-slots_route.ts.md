# Work packet: edit src/app/api/placements/recruiter/drives/[jobId]/interview-slots/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/l14-u025-recruiter-drive.md

## G2-14-025-025  [P2] GAP  facet F08  effort M
- Legacy: RecruiterDriveController.java:173-175 proposeSlots returns added count
- vNext now: src/app/api/placements/recruiter/drives/[jobId]/interview-slots/route.ts:28 redirects303
- Fix: Display count and per-row failures if batch model retained.
