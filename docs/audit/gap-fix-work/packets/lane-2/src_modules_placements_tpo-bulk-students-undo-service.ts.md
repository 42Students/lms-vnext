# Work packet: edit src/modules/placements/tpo-bulk-students-undo-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/tpo-students-hub-controller.md

## G2-4-022-030  [P2] GAP  facet F08  effort M
- Legacy: Legacy bulk higher-studies returns {updated:count}, restore returns {restored:count}. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:97-113`)
- vNext now: New after-college bulk updates and undo service have their own response. (`src/modules/placements/tpo-bulk-students-undo-service.ts:22-43`; `src/modules/placements/tpo-bulk-students-undo-service.ts:97-105`)
- Fix: Align reversible bulk result counts across registration and participation.
