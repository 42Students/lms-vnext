# Work packet (wave 2): edit src/db/schema/placement-registration.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/placement-cell.md

## G2-12-005-082  [P2] GAP  facet F22  effort S
- Legacy: Legacy placement service returns single overview, records choice with consent `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerPlacementController.java:24-25,45-50`
- vNext now: Normalized batch-scoped registration with consentAt/consentVersion and source `src/db/schema/placement-registration.ts:22-70`
- Fix: Map choice and consent lifecycle in parity table
