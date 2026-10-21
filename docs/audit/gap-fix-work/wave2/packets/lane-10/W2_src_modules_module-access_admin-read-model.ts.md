# Work packet (wave 2): edit src/modules/module-access/admin-read-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-features.md, docs/audit/gap2/lane-9/cross-settings-feature-flags.md

## G2-10-007-020  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:19-25` runtime catalog is filtered to safe two columns
- vNext now: `src/modules/module-access/admin-read-model.ts:8-15` labels 3 compiled keys
- Fix: Resolve allowed module display catalog divergence

## G2-9-036-020  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:19-25` runtime catalog is filtered to safe two columns
- vNext now: `src/modules/module-access/admin-read-model.ts:8-15` labels 3 compiled keys
- Fix: Resolve allowed module display catalog divergence
