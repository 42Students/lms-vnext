# Work packet (wave 3): edit src/modules/placements/tpo-outcome-label-settings-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/choices-controller.md

## G2-2-030-001  [P1] MISSING  facet F01  effort L
- Legacy: ChoicesController.java:21-36 exposes one GET /api/v1/choices for all forms and filters.
- vNext now: src/modules/placements/tpo-configuration-read-service.ts:12-28, src/modules/placements/tpo-outcome-label-settings-service.ts:38-57 expose separate restricted settings reads; no single choices read identified.
- Fix: Implement tenant-aware read-only choices aggregate or migrate all consumers with a catalog adapter preserving exact fields/order.
