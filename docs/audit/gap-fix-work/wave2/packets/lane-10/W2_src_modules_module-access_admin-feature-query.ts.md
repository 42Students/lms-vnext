# Work packet (wave 2): edit src/modules/module-access/admin-feature-query.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-features.md, docs/audit/gap2/lane-9/cross-settings-feature-flags.md

## G2-10-007-083  [P3] GAP  facet F20  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:295-296` trim/lowercase locale-independent search
- vNext now: `src/modules/module-access/admin-read-service.ts:171-175` SQL lower/position and `src/modules/module-access/admin-feature-query.ts:3` 100-char limit
- Fix: Verify Unicode and long-input behavior

## G2-9-036-083  [P3] GAP  facet F20  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:295-296` trim/lowercase locale-independent search
- vNext now: `src/modules/module-access/admin-read-service.ts:171-175` SQL lower/position and `src/modules/module-access/admin-feature-query.ts:3` 100-char limit
- Fix: Verify Unicode and long-input behavior
