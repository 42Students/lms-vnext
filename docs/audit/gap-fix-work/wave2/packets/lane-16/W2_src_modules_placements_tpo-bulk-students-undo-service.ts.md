# Work packet (wave 2): edit src/modules/placements/tpo-bulk-students-undo-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/tpo-students-hub-controller.md

## G2-4-022-043  [P2] GAP  facet F12  effort M
- Legacy: Legacy chosen higher-studies and debar can be undone from recorded prior rows. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:103-113`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:153-168`)
- vNext now: New undo audit run only valid 5 min and checks latest action. (`src/modules/placements/tpo-bulk-students-undo-service.ts:22-43`; `src/modules/placements/tpo-bulk-students-undo-service.ts:54-69`)
- Fix: Explain undo expiry and stale safety, keep manual restoration path.
