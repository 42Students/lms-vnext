# Work packet (wave 2): edit src/modules/placements/hr-today-change-request-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u025-recruiter-change-request-controller.md

## G2-16-025-007  [P2] GAP  facet F03  effort S
- Legacy: DriveChangeRequestService.java:90-94 counts open company-facing.
- vNext now: hr-today-change-request-service.ts:7-24 open target COMPANY limit20.
- Fix: Show count of all open, not just 20 enumerated cards.
