# Work packet: edit src/app/(authenticated)/admin/features/page.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-features.md, docs/audit/gap2/lane-9/cross-settings-feature-flags.md

## G2-10-007-010  [P1] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:309-313` three scope-wide metric numbers
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:130-134` total match and on-this-page counts
- Fix: Compute scoped total metrics or label denominator precisely

## G2-10-007-014  [P1] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:263-276` switch for each college-module with aria-label
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:245-254` multi-step disclosure/editor
- Fix: Restore direct switch affordance or approve advanced workflow

## G2-10-007-018  [P1] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:298-299` counts based on whole fetched scopeRows
- vNext now: `src/modules/module-access/admin-read-service.ts:209-210` and `src/app/(authenticated)/admin/features/page.tsx:132-133` counts based on 20-row page
- Fix: Use scope-wide aggregate queries for counts

## G2-9-036-010  [P1] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:309-313` three scope-wide metric numbers
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:130-134` total match and on-this-page counts
- Fix: Compute scoped total metrics or label denominator precisely

## G2-9-036-014  [P1] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:263-276` switch for each college-module with aria-label
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:245-254` multi-step disclosure/editor
- Fix: Restore direct switch affordance or approve advanced workflow

## G2-9-036-018  [P1] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:298-299` counts based on whole fetched scopeRows
- vNext now: `src/modules/module-access/admin-read-service.ts:209-210` and `src/app/(authenticated)/admin/features/page.tsx:132-133` counts based on 20-row page
- Fix: Use scope-wide aggregate queries for counts

## G2-9-036-100  [P1] GAP  facet F03  effort M
- Legacy: Legacy Feature Controls module columns show Projects and Placements only with Toggle switch `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:251-292`
- vNext now: vNext 3 modules displayed with status badges and expanded rule editor `src/app/(authenticated)/admin/features/page.tsx:233-263`
- Fix: Show inline original switches for broad availability and move advanced policy editor elsewhere.

## G2-10-007-039  [P2] MISSING  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:71-76` module catalog outage shows warning with safe two-key fallback
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:23-25` and `src/modules/module-access/service.ts:23-27` build-time list no catalog fetch
- Fix: Keep fallback warning if dynamic catalog remains supported

## G2-9-036-039  [P2] MISSING  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:71-76` module catalog outage shows warning with safe two-key fallback
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:23-25` and `src/modules/module-access/service.ts:23-27` build-time list no catalog fetch
- Fix: Keep fallback warning if dynamic catalog remains supported
