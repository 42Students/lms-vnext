# Work packet (wave 2): edit src/modules/module-access/admin-read-service.ts

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l14-u024-superadmin-feature-controller.md, docs/audit/gap2/lane-10/superadmin-features.md, docs/audit/gap2/lane-9/cross-settings-feature-flags.md

## G2-14-024-023  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:75-144 — GET list returns all scoped colleges without explicit paging
- vNext now: src/modules/module-access/admin-read-service.ts:192-210,235-267 — 20/page, filters and stable order
- Fix: Add CSV/export/all-pages path or clearly page through full list.

## G2-14-024-043  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:136-140 — DTO name/id/modules details
- vNext now: src/modules/module-access/admin-read-service.ts:235-256 — UUID/code/decision list
- Fix: Define migration of old numeric college IDs and booleans into UUID decisions.

## G2-10-007-016  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:136-140` response collegeId/name and moduleDetails
- vNext now: `src/modules/module-access/admin-read-service.ts:234-253` id/name/code plus decisions and stored overrides
- Fix: Map effective bool/level/lock visibly while retaining new code

## G2-10-007-025  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:363-364` pageSize20, size changer, X–Y of N
- vNext now: `src/modules/module-access/admin-read-service.ts:47`,209-210 fixed 20 and `src/app/(authenticated)/admin/features/page.tsx:265-310` prev/next only
- Fix: Add page-size chooser and legacy range wording

## G2-10-007-060  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:54-85`,294-295 clears stale rows, table loading during refresh
- vNext now: `src/app/(authenticated)/admin/features/loading.tsx:4-13` route skeleton; `src/modules/module-access/admin-read-service.ts:153-169` server scope
- Fix: Show legacy inline spinner and scope transition placeholder

## G2-9-036-016  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:136-140` response collegeId/name and moduleDetails
- vNext now: `src/modules/module-access/admin-read-service.ts:234-253` id/name/code plus decisions and stored overrides
- Fix: Map effective bool/level/lock visibly while retaining new code

## G2-9-036-025  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:363-364` pageSize20, size changer, X–Y of N
- vNext now: `src/modules/module-access/admin-read-service.ts:47`,209-210 fixed 20 and `src/app/(authenticated)/admin/features/page.tsx:265-310` prev/next only
- Fix: Add page-size chooser and legacy range wording

## G2-9-036-060  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:54-85`,294-295 clears stale rows, table loading during refresh
- vNext now: `src/app/(authenticated)/admin/features/loading.tsx:4-13` route skeleton; `src/modules/module-access/admin-read-service.ts:153-169` server scope
- Fix: Show legacy inline spinner and scope transition placeholder

## G2-10-007-078  [P3] GAP  facet F19  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:103-119` one inherited-settings query over all visible colleges
- vNext now: `src/modules/module-access/admin-read-service.ts:192-210` DB count and LIMIT20; `src/modules/module-access/admin-read-service.ts:219-220` loads rules only for page
- Fix: Preserve total-scope metrics with scalable query

## G2-10-007-079  [P3] GAP  facet F19  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:295-297` searches in-memory all colleges
- vNext now: `src/modules/module-access/admin-read-service.ts:171-175` SQL lower/position; no indexed substring seen
- Fix: Profile large college-name substring query and add suitable index

## G2-10-007-083  [P3] GAP  facet F20  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:295-296` trim/lowercase locale-independent search
- vNext now: `src/modules/module-access/admin-read-service.ts:171-175` SQL lower/position and `src/modules/module-access/admin-feature-query.ts:3` 100-char limit
- Fix: Verify Unicode and long-input behavior

## G2-9-036-078  [P3] GAP  facet F19  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:103-119` one inherited-settings query over all visible colleges
- vNext now: `src/modules/module-access/admin-read-service.ts:192-210` DB count and LIMIT20; `src/modules/module-access/admin-read-service.ts:219-220` loads rules only for page
- Fix: Preserve total-scope metrics with scalable query

## G2-9-036-079  [P3] GAP  facet F19  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:295-297` searches in-memory all colleges
- vNext now: `src/modules/module-access/admin-read-service.ts:171-175` SQL lower/position; no indexed substring seen
- Fix: Profile large college-name substring query and add suitable index

## G2-9-036-083  [P3] GAP  facet F20  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:295-296` trim/lowercase locale-independent search
- vNext now: `src/modules/module-access/admin-read-service.ts:171-175` SQL lower/position and `src/modules/module-access/admin-feature-query.ts:3` 100-char limit
- Fix: Verify Unicode and long-input behavior
