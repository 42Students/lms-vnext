# Work packet (wave 2): edit src/modules/placements/hr-inline-round-results-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/l14-u025-recruiter-drive.md

## G2-14-025-011  [P2] GAP  facet F04  effort M
- Legacy: RecruiterDriveController.java:44 ResultsRequest.rows arbitrary objects
- vNext now: src/modules/placements/hr-inline-round-results-model.ts:1-110 typed results model
- Fix: Specify row schema, allowed status and identity mapping.
