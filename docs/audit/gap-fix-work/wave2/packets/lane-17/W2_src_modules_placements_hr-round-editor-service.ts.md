# Work packet (wave 2): edit src/modules/placements/hr-round-editor-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/l14-u025-recruiter-drive.md

## G2-14-025-018  [P2] GAP  facet F06  effort M
- Legacy: RecruiterDriveController.java:144 round kind/name/mode fields
- vNext now: src/modules/placements/hr-round-editor-service.ts:16-18 validates hrRoundFormSchema
- Fix: Compare kind/mode enums, name max, duplicates.

## G2-14-025-032  [P2] GAP  facet F10  effort M
- Legacy: RecruiterDriveController.java:147-160 POST/PUT/DELETE rounds
- vNext now: src/modules/placements/hr-round-editor-service.ts:16-115 CAS, CANCELLED status
- Fix: Map deletion vs cancellation and optimistic token.

## G2-14-025-040  [P2] GAP  facet F12  effort M
- Legacy: RecruiterDriveController.java:144-160 round remove
- vNext now: src/modules/placements/hr-round-editor-service.ts:96-115 CANCELLED with CAS
- Fix: Keep historical changes and hidden canceled semantics.

## G2-14-025-043  [P2] GAP  facet F13  effort M
- Legacy: RecruiterDriveController.java:205-209 conflict human reasons
- vNext now: src/modules/placements/hr-round-editor-service.ts:55-60 inaccessible drive not found
- Fix: Show readable access ended/drive over notice.
