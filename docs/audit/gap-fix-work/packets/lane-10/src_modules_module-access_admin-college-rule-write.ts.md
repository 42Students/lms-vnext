# Work packet: edit src/modules/module-access/admin-college-rule-write.ts

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l14-u024-superadmin-feature-controller.md, docs/audit/gap2/lane-10/superadmin-features.md, docs/audit/gap2/lane-6/l19-u026-module-access-controller.md, docs/audit/gap2/lane-9/cross-settings-feature-flags.md

## G2-14-024-026  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:178-205 — ancestors or own lock prevents dormant college override
- vNext now: src/modules/module-access/admin-college-rule-write.ts:31-45 — ancestor lock blocks updates, own lock managed with state
- Fix: Define and enforce college-level own-lock edit/unlock permissions explicitly.

## G2-10-007-049  [P1] GAP  facet F10  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:208-222` transactional COLLEGE app_setting upsert plus required audit log
- vNext now: `src/modules/module-access/admin-college-rule-write.ts:40-54` upsert/delete module_access_rules plus activityEvents
- Fix: Define setting-key conversion and audit equivalence

## G2-10-007-058  [P1] GAP  facet F12  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:178-206` refuses college writes under inherited/college locks
- vNext now: `src/modules/module-access/admin-college-rule-write.ts:31-39` blocks ancestor-locked SET only, `src/components/admin/college-feature-rule-editor.tsx:75-83` can edit lock
- Fix: Audit college-local lock mutation authority before adopting editor

## G2-19-026-059  [P1] GAP  facet F21  effort M
- Legacy: Legacy history captures MODULE_ACCESS_SET, MODULE_ACCESS_BULK_SET, COLLEGE_FEATURE_TOGGLE. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleAccessService.java:411`
- vNext now: vNext event taxonomy uses PLATFORM_COLLEGE_MODULE_RULE_CHANGED and MODULE_ACCESS_BULK_SET. `src/modules/module-access/admin-college-rule-write.ts:47`
- Fix: Map both event taxonomies and include old categories in unified history/export.

## G2-9-036-049  [P1] GAP  facet F10  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:208-222` transactional COLLEGE app_setting upsert plus required audit log
- vNext now: `src/modules/module-access/admin-college-rule-write.ts:40-54` upsert/delete module_access_rules plus activityEvents
- Fix: Define setting-key conversion and audit equivalence

## G2-9-036-058  [P1] GAP  facet F12  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:178-206` refuses college writes under inherited/college locks
- vNext now: `src/modules/module-access/admin-college-rule-write.ts:31-39` blocks ancestor-locked SET only, `src/components/admin/college-feature-rule-editor.tsx:75-83` can edit lock
- Fix: Audit college-local lock mutation authority before adopting editor

## G2-9-036-120  [P1] GAP  facet F10  effort L
- Legacy: Old module toggles stored in app_setting with keys enabled/locked `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleFeatureCatalog.java:23-37,88-105`
- vNext now: New boolean module_access_rules written transactionally `src/modules/module-access/admin-college-rule-write.ts:40-54`
- Fix: Migrate old settings records preserving all levels/locks/defaults; audit colliding values.

## G2-10-007-034  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:155-168` exact missing-key and unknown-module response messages
- vNext now: `src/app/api/admin/features/[collegeId]/rules/route.ts:17-25` and `src/modules/module-access/admin-college-rule-write.ts:13-16` strict union schema generic errors
- Fix: Surface legacy-compatible module and enabled validation text

## G2-10-007-035  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:170-176` missing/deleted college 404 No college with id X
- vNext now: `src/modules/module-access/admin-college-rule-write.ts:18-20` and `src/app/api/admin/features/[collegeId]/rules/route.ts:24` return NOT_FOUND
- Fix: Replace raw code with explicit missing-college message

## G2-10-007-036  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:190-205` lock conflict explains Module Access remediation
- vNext now: `src/modules/module-access/admin-college-rule-write.ts:31-39` and `src/components/admin/college-feature-rule-editor.tsx:61-63` concise ANCESTOR_LOCKED message
- Fix: Add Module Access action to lock error

## G2-9-036-034  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:155-168` exact missing-key and unknown-module response messages
- vNext now: `src/app/api/admin/features/[collegeId]/rules/route.ts:17-25` and `src/modules/module-access/admin-college-rule-write.ts:13-16` strict union schema generic errors
- Fix: Surface legacy-compatible module and enabled validation text

## G2-9-036-035  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:170-176` missing/deleted college 404 No college with id X
- vNext now: `src/modules/module-access/admin-college-rule-write.ts:18-20` and `src/app/api/admin/features/[collegeId]/rules/route.ts:24` return NOT_FOUND
- Fix: Replace raw code with explicit missing-college message

## G2-9-036-036  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:190-205` lock conflict explains Module Access remediation
- vNext now: `src/modules/module-access/admin-college-rule-write.ts:31-39` and `src/components/admin/college-feature-rule-editor.tsx:61-63` concise ANCESTOR_LOCKED message
- Fix: Add Module Access action to lock error

## G2-9-036-113  [P2] GAP  facet F07  effort S
- Legacy: Legacy toggle fails with Request must include both module and enabled `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:155-162`
- vNext now: New write payload SET/INHERIT, enabled+locked+expected and Zod errors `src/modules/module-access/admin-college-rule-write.ts:13-29`
- Fix: Map malformed switch body to original actionable text in simple-toggle API.

## G2-9-036-114  [P2] GAP  facet F07  effort S
- Legacy: Legacy locked ancestor error tells Change it in Module Access `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:178-204`
- vNext now: New StudentRuleConflict ANCESTOR_LOCKED `src/modules/module-access/admin-college-rule-write.ts:31-39`
- Fix: Expose level and Module Access route instead of internal error code.
