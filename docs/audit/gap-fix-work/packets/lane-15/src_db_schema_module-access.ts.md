# Work packet: edit src/db/schema/module-access.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-features.md, docs/audit/gap2/lane-10/superadmin-module-access.md, docs/audit/gap2/lane-4/superadmin-module-access.md, docs/audit/gap2/lane-9/cross-settings-feature-flags.md

## G2-10-007-088  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AppSetting.java:9-25` app_setting string setting_key/value and integer scope
- vNext now: `src/db/schema/module-access.ts:14-33` typed UUID module_access_rules booleans/lock
- Fix: Write explicit app_setting-to-rule migration map when data migration applies

## G2-10-019-103  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:19-27 — Old levels LEARNER, CLASS, BATCH; selected college numeric ID.
- vNext now: src/db/schema/module-access.ts:17-38 — New UUID scopeId and MEMBERSHIP, SECTION, COHORT semantics.
- Fix: Map learner→membership, class→section, batch→cohort, college IDs.

## G2-4-030-078  [P1] GAP  facet F22  effort M
- Legacy: Scopes GLOBAL/ORGANIZATION/COLLEGE/DEPARTMENT/PROGRAM/BATCH/CLASS/LEARNER (`docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:19-29`)
- vNext now: Stored enum uses MEMBERSHIP/SECTION/COHORT instead of LEARNER/CLASS/BATCH (`src/db/schema/module-access.ts:34-47`)
- Fix: Migration mapping and UI scope alias table required.

## G2-9-036-088  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AppSetting.java:9-25` app_setting string setting_key/value and integer scope
- vNext now: `src/db/schema/module-access.ts:14-33` typed UUID module_access_rules booleans/lock
- Fix: Write explicit app_setting-to-rule migration map when data migration applies

## G2-9-036-136  [P1] GAP  facet F22  effort L
- Legacy: Legacy module rule AppSetting stores String key/value and scope/global/org/college IDs `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AppSetting.java:9-25`
- vNext now: New moduleAccessRules typed booleans and scope/UUID indexes `src/db/schema/module-access.ts:14-58`
- Fix: Implement deterministic migration and deny unknown raw keys to typed module writer.
