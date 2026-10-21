# Work packet (wave 2): edit src/modules/module-access/admin-college-rule-write.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l14-u024-superadmin-feature-controller.md, docs/audit/gap2/lane-10/superadmin-features.md, docs/audit/gap2/lane-4/superadmin-module-access.md, docs/audit/gap2/lane-9/cross-settings-feature-flags.md

## G2-14-024-014  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/FeatureFlagUpdateRequest.java:6-12 — module string + nullable enabled; both required
- vNext now: src/modules/module-access/admin-college-rule-write.ts:11,25-30 — validated college rule schema with action INHERIT/ON/OFF, expected state
- Fix: Map fields and safe omission rejection to new body.

## G2-14-024-022  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:146-150 — PUT route /{collegeId} with {module,enabled}
- vNext now: src/modules/module-access/admin-college-rule-write.ts:11-54 — transactional college module rule write with INHERIT/ON/OFF
- Fix: Document versioned API mapping and non-backwards compatibility.

## G2-14-024-031  [P2] GAP  facet F15  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:219-220 — required admin audit COLLEGE_FEATURE_TOGGLE includes previous/new values
- vNext now: src/modules/module-access/admin-college-rule-write.ts:48-54 — PLATFORM_COLLEGE_MODULE_RULE_CHANGED event, before/after metadata
- Fix: Crosswalk old and new event taxonomy for compliance searches.

## G2-14-024-042  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleFeatureCatalog.java:27-37,69-76 — settings key map and paid placements default
- vNext now: src/modules/module-access/admin-college-rule-write.ts:40-54 — normalized module_access_rules scope COLLEGE
- Fix: Map historical app_settings keys, lock values and source defaults to vNext rules.

## G2-10-007-054  [P2] GAP  facet F11  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:190-205` blocks inherited and college lock simple toggle
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:73-83` and `src/modules/module-access/admin-college-rule-write.ts:31-39` permit Inherit cleanup but block ancestor SET
- Fix: Clarify locally locked edit paths and do not silently bypass lock

## G2-10-007-091  [P2] GAP  facet F22  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:172-175` accepts existing not-deleted college
- vNext now: `src/modules/module-access/admin-college-rule-write.ts:18-20` requires ACTIVE college under FOR UPDATE
- Fix: Resolve inactive-but-not-deleted eligibility difference

## G2-4-030-046  [P2] GAP  facet F11  effort M
- Legacy: College row read-only unless canEditCollege; lock only isSuperAdmin (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:435-543`)
- vNext now: Require Super Admin and admin-scope.select+college.manage (`src/modules/module-access/admin-college-rule-write.ts:13-24`)
- Fix: Preserve explicit canEditCollege hint and role-aware controls.

## G2-4-030-077  [P2] GAP  facet F21  effort M
- Legacy: Admin audit history includes MODULE_ACCESS_SET/MODULE_ACCESS_BULK_SET/COLLEGE_FEATURE_TOGGLE (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:171-193`)
- vNext now: New activity event taxonomy for college module rule writes (`src/modules/module-access/admin-college-rule-write.ts:47-54`)
- Fix: Map legacy audit action labels in combined history view.

## G2-9-036-054  [P2] GAP  facet F11  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:190-205` blocks inherited and college lock simple toggle
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:73-83` and `src/modules/module-access/admin-college-rule-write.ts:31-39` permit Inherit cleanup but block ancestor SET
- Fix: Clarify locally locked edit paths and do not silently bypass lock

## G2-9-036-091  [P2] GAP  facet F22  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:172-175` accepts existing not-deleted college
- vNext now: `src/modules/module-access/admin-college-rule-write.ts:18-20` requires ACTIVE college under FOR UPDATE
- Fix: Resolve inactive-but-not-deleted eligibility difference
