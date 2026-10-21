# Work packet (wave 2): edit src/db/schema/module-access.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-features.md, docs/audit/gap2/lane-10/superadmin-module-access.md, docs/audit/gap2/lane-4/superadmin-module-access.md, docs/audit/gap2/lane-6/l19-u026-module-access-controller.md, docs/audit/gap2/lane-9/cross-settings-feature-flags.md

## G2-10-007-089  [P2] GAP  facet F22  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleFeatureCatalog.java:28-37` settings keys for Projects/Placements/Electives
- vNext now: `src/db/schema/module-access.ts:35-58` module constraint and unique partial indexes
- Fix: Validate key/default/null semantics in migration/reconciliation

## G2-10-019-105  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:515-517,565-575 — Resolved inherited rules show shadowing and higher-level lock.
- vNext now: src/db/schema/module-access.ts:18-32; src/modules/module-access/service.ts:98-153 — Stored table has enabled/locked; resolver can calculate winners but no hierarchy DTO shown.
- Fix: Expose effective result and lock shadow in tree API response.

## G2-4-030-081  [P2] GAP  facet F22  effort M
- Legacy: Legacy lock without value can be explicitly cleared (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:327-347`)
- vNext now: enabled NOT NULL and locked Boolean; cannot persist orphan lock with no value (`src/db/schema/module-access.ts:20-22`)
- Fix: Migrate orphan locks with safe cleanup report, not synthetic enabled false.

## G2-19-026-060  [P2] GAP  facet F22  effort M
- Legacy: Legacy rules persisted in app_settings as text keys plus lock key. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleAccessService.java:534`
- vNext now: vNext PostgreSQL module_access_rules typed booleans with scoped unique indexes. `src/db/schema/module-access.ts:14`
- Fix: Document migration conversion and contradictory duplicate override handling.

## G2-9-036-089  [P2] GAP  facet F22  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleFeatureCatalog.java:28-37` settings keys for Projects/Placements/Electives
- vNext now: `src/db/schema/module-access.ts:35-58` module constraint and unique partial indexes
- Fix: Validate key/default/null semantics in migration/reconciliation

## G2-9-036-139  [P2] GAP  facet F22  effort M
- Legacy: Old optional settings parse yes/no/0/1/off/on and failclosed malformed values `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleFeatureCatalog.java:40-55,128-137`
- vNext now: New moduleAccessRules boolean-notnull excludes malformed persisted entries `src/db/schema/module-access.ts:17-33`
- Fix: Migrate legacy truthy tokens through exact parser, reject malformed as OFF.
