# Work packet (wave 3): edit src/db/schema/placement-drive-change-requests.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u025-recruiter-change-request-controller.md

## G2-16-025-052  [P0] MISSING  facet F23  effort L
- Legacy: DriveChangeRequestService.java:154-191 accepted/answered fields mutate drive.
- vNext now: placement-drive-change-requests.ts:6 comment explicitly `never implicit drive mutation`.
- Fix: Owner decision required; if parity mandatory implement apply-on-accept/answer with audit.
