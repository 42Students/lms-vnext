# Work packet (wave 2): edit src/modules/module-access/admin-descendant-rule-write.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/superadmin-module-access.md, docs/audit/gap2/lane-6/l19-u026-module-access-controller.md

## G2-4-030-013  [P2] GAP  facet F04  effort M
- Legacy: Hierarchy includes GLOBAL/ORGANIZATION/COLLEGE/DEPARTMENT/PROGRAM/BATCH/CLASS (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:582-600`)
- vNext now: Academic query uses DEPARTMENT/PROGRAM/COHORT/SECTION; college/global in other table (`src/modules/module-access/admin-descendant-rule-write.ts:13-15,39-43`)
- Fix: Unify displayed lineage; map batch→cohort, class→section.

## G2-4-030-018  [P2] GAP  facet F05  effort M
- Legacy: Hierarchy table has no pagination and horizontal scroll (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:697-703`)
- vNext now: Academic scopes paginated in batches of 500 (`src/modules/module-access/admin-descendant-rule-write.ts:46-60`)
- Fix: Use lazy tree expansion/virtualized rows while retaining scroll semantics.

## G2-4-030-044  [P2] GAP  facet F10  effort M
- Legacy: setModuleAccess value for any scope including COLLEGE and LEARNER (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:359-363`)
- vNext now: New descendant editor restricts types and authenticated SA writes (`src/modules/module-access/admin-descendant-rule-write.ts:9-16,133-188`)
- Fix: Map all legacy scope types to current academic hierarchy and owner permissions.

## G2-19-026-053  [P2] GAP  facet F19  effort M
- Legacy: Legacy getTree queries all academic levels in bounded number of DB fetches. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleAccessService.java:74`
- vNext now: vNext scope inventory has SQL CTE and page size 500. `src/modules/module-access/admin-descendant-rule-write.ts:46`
- Fix: Provide full counts and page count, prevent silent truncation beyond 500.
