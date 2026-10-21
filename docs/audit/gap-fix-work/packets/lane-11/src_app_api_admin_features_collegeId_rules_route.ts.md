# Work packet: edit src/app/api/admin/features/[collegeId]/rules/route.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-features.md, docs/audit/gap2/lane-9/cross-settings-feature-flags.md

## G2-10-007-047  [P1] GAP  facet F10  effort S
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:48-54` GET feature list/catalog and PUT /features/{collegeId} module/enabled
- vNext now: `src/modules/module-access/admin-read-service.ts:140-147` queries DB; `src/app/api/admin/features/[collegeId]/rules/route.ts:17-24` PUT /api/admin/features/{id}/rules with action and expected
- Fix: Document client/API migration and payload versioning

## G2-9-036-047  [P1] GAP  facet F10  effort S
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:48-54` GET feature list/catalog and PUT /features/{collegeId} module/enabled
- vNext now: `src/modules/module-access/admin-read-service.ts:140-147` queries DB; `src/app/api/admin/features/[collegeId]/rules/route.ts:17-24` PUT /api/admin/features/{id}/rules with action and expected
- Fix: Document client/API migration and payload versioning

## G2-10-007-034  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:155-168` exact missing-key and unknown-module response messages
- vNext now: `src/app/api/admin/features/[collegeId]/rules/route.ts:17-25` and `src/modules/module-access/admin-college-rule-write.ts:13-16` strict union schema generic errors
- Fix: Surface legacy-compatible module and enabled validation text

## G2-10-007-035  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:170-176` missing/deleted college 404 No college with id X
- vNext now: `src/modules/module-access/admin-college-rule-write.ts:18-20` and `src/app/api/admin/features/[collegeId]/rules/route.ts:24` return NOT_FOUND
- Fix: Replace raw code with explicit missing-college message

## G2-9-036-034  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:155-168` exact missing-key and unknown-module response messages
- vNext now: `src/app/api/admin/features/[collegeId]/rules/route.ts:17-25` and `src/modules/module-access/admin-college-rule-write.ts:13-16` strict union schema generic errors
- Fix: Surface legacy-compatible module and enabled validation text

## G2-9-036-035  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:170-176` missing/deleted college 404 No college with id X
- vNext now: `src/modules/module-access/admin-college-rule-write.ts:18-20` and `src/app/api/admin/features/[collegeId]/rules/route.ts:24` return NOT_FOUND
- Fix: Replace raw code with explicit missing-college message
