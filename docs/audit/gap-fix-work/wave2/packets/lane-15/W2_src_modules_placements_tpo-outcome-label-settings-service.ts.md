# Work packet (wave 2): edit src/modules/placements/tpo-outcome-label-settings-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/choices-controller.md

## G2-2-030-032  [P2] GAP  facet F10  effort M
- Legacy: ChoicesController.java:35-82 performs one GET returning all option sets and two college-scoped SQL reads.
- vNext now: src/modules/placements/tpo-configuration-read-service.ts:12-28 and tpo-outcome-label-settings-service.ts:38-57 fetch separately.
- Fix: Choose aggregated batched read or shared session query to reduce N API calls and inconsistent state.

## G2-2-030-060  [P2] GAP  facet F20  effort M
- Legacy: ChoicesController.java:85-92 silently suppresses all RuntimeException while resolving college.
- vNext now: src/modules/placements/tpo-outcome-label-settings-service.ts:38-57 throws on unauthorized/missing college.
- Fix: Differentiate no-college fallback from real auth failure; never suppress invalid credentials to leak custom choices.

## G2-2-030-067  [P2] GAP  facet F22  effort L
- Legacy: ChoicesController.java:41-56 dynamic TPO settings use JobTypeService and PlacementOutcomeService.
- vNext now: src/modules/placements/tpo-outcome-label-settings-service.ts:52-55 reads placementTpoCollegeSettings JSON, config read :12-28 uses placementTpoJobTypes table.
- Fix: Migrate per-college hidden/custom job type metadata, outcome label ID mapping and counts as placed.

## G2-2-030-070  [P2] GAP  facet F23  effort M
- Legacy: ChoicesController.java:85-92 makes fixed options available without college.
- vNext now: src/modules/placements/tpo-outcome-label-settings-service.ts:38-51 gated to TPO actor.
- Fix: Separate universal choices route from scoped editable settings.
