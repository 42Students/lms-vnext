# Work packet (wave 2): edit src/modules/module-access/service.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-module-access.md, docs/audit/gap2/lane-2/cross-02-authorization-roles.md, docs/audit/gap2/lane-7/u025-mentor-landing.md, docs/audit/gap2/lane-8/l11-u027-feature-flags.md

## G2-10-019-105  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:515-517,565-575 — Resolved inherited rules show shadowing and higher-level lock.
- vNext now: src/db/schema/module-access.ts:18-32; src/modules/module-access/service.ts:98-153 — Stored table has enabled/locked; resolver can calculate winners but no hierarchy DTO shown.
- Fix: Expose effective result and lock shadow in tree API response.

## G2-2-036-035  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/access/AccessControlService.java:327-341 learner course active audience
- vNext now: src/modules/module-access/service.ts:23-71 module flags elective/placement/projects with defaults
- Fix: Combine module access with course audience, not replace it.

## G2-7-025-051  [P2] GAP  facet F21  effort L
- Legacy: useCollegeFeatureFlags.js:60 GET /api/v1/features/mine; cache keyed JWT subject
- vNext now: module-access/service.ts:98-153 computes hierarchical access from DB rules
- Fix: Document service-to-DB equivalence and integration ownership

## G2-7-025-053  [P2] GAP  facet F22  effort L
- Legacy: useCollegeFeatureFlags.js:18-27 feature response projectsEnabled/modules.projects booleans
- vNext now: module-access/service.ts:47-71 rule objects scope, enabled, locked and defaults
- Fix: Crosswalk legacy feature flags to hierarchical module_access_rules and levels

## G2-11-027-003  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FeatureFlagController.java:35-60 JSON response, no DOM.
- vNext now: src/modules/module-access/service.ts:322-327 returns internal object; src/modules/module-access/learner-shell-access.ts:42-48 transforms for shell and hides source trace.
- Fix: Add normalized JSON response and preserve legacy top-level data wrapper.

## G2-11-027-005  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FeatureFlagController.java:44-50 every ModuleFeatureCatalog key in deterministic iteration order.
- vNext now: src/modules/module-access/service.ts:23-27 only projects,placements,electives; catalog coverage may differ.
- Fix: Map every old optional module key and deliberate retires without silently omitting key.

## G2-11-027-019  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleAccessResolver.java:25-60 precedence learner,class,batch,program,department,college,organization,global.
- vNext now: src/modules/module-access/service.ts:32-40 maps MEMBERSHIP,SECTION,COHORT,PROGRAM,DEPARTMENT,COLLEGE,ORGANIZATION,GLOBAL.
- Fix: Define exact rename mapping learner↔membership, class↔section, batch↔cohort in UI trace.

## G2-11-027-033  [P2] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleAccessResolver.java:62-83 resolves flags from AppSettingRepository rows, numeric scoped IDs.
- vNext now: src/modules/module-access/service.ts:300-318 reads normalized moduleAccessRules UUID-scoped rows.
- Fix: Document AppSetting->module_access_rules hierarchy mapping and flags migration policy.
