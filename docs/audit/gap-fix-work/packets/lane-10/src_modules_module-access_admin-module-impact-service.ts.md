# Work packet: edit src/modules/module-access/admin-module-impact-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-features.md, docs/audit/gap2/lane-9/cross-settings-feature-flags.md

## G2-10-007-044  [P1] MISSING  facet F09  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:212-248` four-count placements dialog in 2-column grid
- vNext now: `src/modules/module-access/admin-module-impact-service.ts:50-65` computes only active drives/applications/offers
- Fix: Query upcoming interviews and render all 4 legacy counters

## G2-10-007-084  [P1] MISSING  facet F20  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:246-247` upcoming interview count compares UTC now
- vNext now: `src/modules/module-access/admin-module-impact-service.ts:50-65` no interview query
- Fix: Restore future interview count with UTC cutoff

## G2-9-036-044  [P1] MISSING  facet F09  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:212-248` four-count placements dialog in 2-column grid
- vNext now: `src/modules/module-access/admin-module-impact-service.ts:50-65` computes only active drives/applications/offers
- Fix: Query upcoming interviews and render all 4 legacy counters

## G2-9-036-084  [P1] MISSING  facet F20  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:246-247` upcoming interview count compares UTC now
- vNext now: `src/modules/module-access/admin-module-impact-service.ts:50-65` no interview query
- Fix: Restore future interview count with UTC cutoff

## G2-9-036-111  [P1] MISSING  facet F06  effort M
- Legacy: Old Placements OFF action previews jobs/apps/offers/interviews `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:194-249`
- vNext now: New module-impact response lacks interview count per prior service audit `src/modules/module-access/admin-module-impact-service.ts:50-65`
- Fix: Add upcoming interviews and exact 2-column impact preview.
