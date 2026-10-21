# Work packet: edit src/app/(authenticated)/admin/features/error.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-features.md, docs/audit/gap2/lane-9/cross-settings-feature-flags.md

## G2-10-007-038  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:65-82` refresh failure clears switches and shows loadError
- vNext now: `src/app/(authenticated)/admin/features/error.tsx:13-24` page-level ErrorState with retry
- Fix: Preserve granular inline load feedback and raw failure reason

## G2-9-036-038  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:65-82` refresh failure clears switches and shows loadError
- vNext now: `src/app/(authenticated)/admin/features/error.tsx:13-24` page-level ErrorState with retry
- Fix: Preserve granular inline load feedback and raw failure reason
