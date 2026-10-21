# Work packet (wave 2): edit src/app/(authenticated)/admin/features/error.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-features.md, docs/audit/gap2/lane-9/cross-settings-feature-flags.md

## G2-10-007-062  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:350-355` independent module catalog partial outage and Retry
- vNext now: `src/app/(authenticated)/admin/features/error.tsx:13-24` page error but no partial catalog banner
- Fix: Preserve recoverable degraded-catalog warning

## G2-9-036-062  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:350-355` independent module catalog partial outage and Retry
- vNext now: `src/app/(authenticated)/admin/features/error.tsx:13-24` page error but no partial catalog banner
- Fix: Preserve recoverable degraded-catalog warning
