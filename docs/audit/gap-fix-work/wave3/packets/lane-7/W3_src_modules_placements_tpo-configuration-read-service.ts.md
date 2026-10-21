# Work packet (wave 3): edit src/modules/placements/tpo-configuration-read-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/choices-controller.md

## G2-2-030-001  [P1] MISSING  facet F01  effort L
- Legacy: ChoicesController.java:21-36 exposes one GET /api/v1/choices for all forms and filters.
- vNext now: src/modules/placements/tpo-configuration-read-service.ts:12-28, src/modules/placements/tpo-outcome-label-settings-service.ts:38-57 expose separate restricted settings reads; no single choices read identified.
- Fix: Implement tenant-aware read-only choices aggregate or migrate all consumers with a catalog adapter preserving exact fields/order.

## G2-2-030-014  [P1] MISSING  facet F04  effort L
- Legacy: ChoicesController.java:76-81 returns branches and passingYears as `{value,label}` strings.
- vNext now: src/modules/placements/tpo-configuration-read-service.ts:12-28 returns job-type settings, not college learner-based branches/years.
- Fix: Implement tenant-scoped DISTINCT branches and passing years endpoint using live eligible learner data.

## G2-2-030-068  [P1] MISSING  facet F22  effort L
- Legacy: ChoicesController.java:76-81 branches drawn from learner.department and academic record passingYear.
- vNext now: src/modules/placements/tpo-configuration-read-service.ts:12-28 has no equivalent derived projection.
- Fix: Join vNext membership+profile/academic records to derive same options from active tenant data.
