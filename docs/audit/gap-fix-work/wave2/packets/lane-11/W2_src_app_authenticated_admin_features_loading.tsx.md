# Work packet (wave 2): edit src/app/(authenticated)/admin/features/loading.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-features.md, docs/audit/gap2/lane-9/cross-settings-feature-flags.md

## G2-10-007-060  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:54-85`,294-295 clears stale rows, table loading during refresh
- vNext now: `src/app/(authenticated)/admin/features/loading.tsx:4-13` route skeleton; `src/modules/module-access/admin-read-service.ts:153-169` server scope
- Fix: Show legacy inline spinner and scope transition placeholder

## G2-9-036-060  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:54-85`,294-295 clears stale rows, table loading during refresh
- vNext now: `src/app/(authenticated)/admin/features/loading.tsx:4-13` route skeleton; `src/modules/module-access/admin-read-service.ts:153-169` server scope
- Fix: Show legacy inline spinner and scope transition placeholder
