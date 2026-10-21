# Work packet: edit src/modules/module-access/service.ts

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-features.md, docs/audit/gap2/lane-10/superadmin-module-access.md, docs/audit/gap2/lane-7/u025-mentor-landing.md, docs/audit/gap2/lane-8/l11-u027-feature-flags.md, docs/audit/gap2/lane-9/cross-settings-feature-flags.md

## G2-10-007-057  [P1] GAP  facet F12  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleFeatureCatalog.java:62-85` Placements ignores below-college policy scopes
- vNext now: `src/modules/module-access/service.ts:80-88` explicitly evaluates lower levels for Placements
- Fix: Choose legacy college-only vs new learner-level Placements authorization

## G2-10-019-100  [P1] GAP  facet F21  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:11-13; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ModuleAccessController.java:46-67 — Legacy module-access endpoints call ModuleAccessService and resolved eligibility.
- vNext now: src/modules/module-access/service.ts:98-153 — New module resolver includes additional Electives and scope names; no direct legacy endpoint.
- Fix: Map scope chains, locks and placement eligibility exactly across integrations.

## G2-7-025-030  [P1] GAP  facet F12  effort L
- Legacy: useCollegeFeatureFlags.js:12-15 unknown flags default projects disabled until fetched
- vNext now: module-access/service.ts:67-71 resolver default Projects true, subject to persisted overrides
- Fix: Verify missing rule/default parity and no unauthorized automatic access

## G2-11-027-001  [P1] MISSING  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FeatureFlagController.java:19-36 authenticated GET /api/v1/features/mine.
- vNext now: src/modules/module-access/service.ts:322-327 internal resolveOptionalModuleAccess; /api/features or /api/module-access/mine route not found.
- Fix: Restore read-only /api/features/mine compatibility endpoint or defined replacement response.

## G2-11-027-006  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FeatureFlagController.java:48-49 missing resolution defaults enabled=true.
- vNext now: src/modules/module-access/service.ts:67-71 placements defaults false, projects/electives true.
- Fix: Decide explicit placement opt-in default and document intentional visibility change.

## G2-11-027-023  [P1] GAP  facet F13  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FeatureFlagController.java:48-49 absent rule reads enabled by default.
- vNext now: src/modules/module-access/service.ts:67-71 placements false absent rule, all new learners see no placements unless configured.
- Fix: Owner decision on source default; distinguish no rule vs false stored rule.

## G2-11-027-034  [P1] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FeatureFlagController.java:44-50 dynamic ModuleFeatureCatalog count; app_setting default enabled if no override.
- vNext now: src/modules/module-access/service.ts:23-27 catalog three and defaults placements false.
- Fix: Ensure every old module key and default is intentionally mapped.

## G2-9-036-057  [P1] GAP  facet F12  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleFeatureCatalog.java:62-85` Placements ignores below-college policy scopes
- vNext now: `src/modules/module-access/service.ts:80-88` explicitly evaluates lower levels for Placements
- Fix: Choose legacy college-only vs new learner-level Placements authorization

## G2-9-036-122  [P1] GAP  facet F12  effort L
- Legacy: Old Placements ignores below-college levels, eligibility done by placement cell `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleFeatureCatalog.java:62-85`
- vNext now: New placements hierarchy resolved at learner/section/cohort/etc `src/modules/module-access/service.ts:80-88`
- Fix: Keep Placements toggle college-only; use eligibility separately, unless owner explicitly changes policy.

## G2-10-007-039  [P2] MISSING  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:71-76` module catalog outage shows warning with safe two-key fallback
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:23-25` and `src/modules/module-access/service.ts:23-27` build-time list no catalog fetch
- Fix: Keep fallback warning if dynamic catalog remains supported

## G2-11-027-011  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/FeatureFlagService.java:59-63 FEATURE_DISABLED response HTTP403.
- vNext now: src/modules/module-access/service.ts:322-327 returns access flags but no route error response; per-module callers enforce via policy.
- Fix: Ensure disabled API mutation paths return stable FEATURE_DISABLED code.

## G2-9-036-039  [P2] MISSING  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:71-76` module catalog outage shows warning with safe two-key fallback
- vNext now: `src/app/(authenticated)/admin/features/page.tsx:23-25` and `src/modules/module-access/service.ts:23-27` build-time list no catalog fetch
- Fix: Keep fallback warning if dynamic catalog remains supported
