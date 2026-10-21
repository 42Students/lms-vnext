# Work packet: edit src/modules/module-access/admin-read-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-features.md, docs/audit/gap2/lane-10/superadmin-module-access.md, docs/audit/gap2/lane-9/cross-settings-feature-flags.md

## G2-10-007-018  [P1] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:298-299` counts based on whole fetched scopeRows
- vNext now: `src/modules/module-access/admin-read-service.ts:209-210` and `src/app/(authenticated)/admin/features/page.tsx:132-133` counts based on 20-row page
- Fix: Use scope-wide aggregate queries for counts

## G2-10-007-047  [P1] GAP  facet F10  effort S
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:48-54` GET feature list/catalog and PUT /features/{collegeId} module/enabled
- vNext now: `src/modules/module-access/admin-read-service.ts:140-147` queries DB; `src/app/api/admin/features/[collegeId]/rules/route.ts:17-24` PUT /api/admin/features/{id}/rules with action and expected
- Fix: Document client/API migration and payload versioning

## G2-10-019-095  [P1] GAP  facet F19  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:217-257 — Fetches full resolved college tree at once, potentially hundreds of nodes.
- vNext now: src/modules/module-access/admin-read-service.ts:47-48; src/app/(authenticated)/admin/features/[collegeId]/page.tsx:245-315 — New limited lists may omit unconfigured nodes.
- Fix: Balance full parity with paginated hierarchy data, guarantee no silently missing nodes.

## G2-9-036-018  [P1] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:298-299` counts based on whole fetched scopeRows
- vNext now: `src/modules/module-access/admin-read-service.ts:209-210` and `src/app/(authenticated)/admin/features/page.tsx:132-133` counts based on 20-row page
- Fix: Use scope-wide aggregate queries for counts

## G2-9-036-047  [P1] GAP  facet F10  effort S
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:48-54` GET feature list/catalog and PUT /features/{collegeId} module/enabled
- vNext now: `src/modules/module-access/admin-read-service.ts:140-147` queries DB; `src/app/api/admin/features/[collegeId]/rules/route.ts:17-24` PUT /api/admin/features/{id}/rules with action and expected
- Fix: Document client/API migration and payload versioning
