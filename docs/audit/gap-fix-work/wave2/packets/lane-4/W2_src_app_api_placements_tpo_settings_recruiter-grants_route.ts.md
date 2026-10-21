# Work packet (wave 2): edit src/app/api/placements/tpo/settings/recruiter-grants/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l15-u022-tpo-recruiter-access-controller.md

## G2-15-022-002  [P2] GAP  facet F01  effort M
- Legacy: Controller extends `/recruiterId/extend` and revokes `/recruiterId/revoke`; TpoRecruiterAccessController.java:92-95,118-120
- vNext now: Single POST `/api/placements/tpo/settings/recruiter-grants` action union; recruiter-grants/route.ts:7-17; tpo-recruiter-grant-write-model.ts:4-22
- Fix: Provide endpoint mapping in API compatibility notes; ensure callers use UUID grantId not legacy recruiter integer.
