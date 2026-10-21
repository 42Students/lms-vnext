# Work packet: edit src/db/schema/platform-setting-overrides.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l17-u029-tenant-settings.md, docs/audit/gap2/lane-14/u021-app-setting.md, docs/audit/gap2/lane-9/cross-settings-feature-flags.md

## G2-17-029-058  [P1] GAP  facet F22  effort L
- Legacy: legacy TenantAdminController.java:637-762 app_setting keyed by scopeType, numeric scopeId and key, deletes rows to default
- vNext now: vNext platform-setting-overrides.ts:5-17 pk(scopeType,scopeId,key), varchar value, integer version and audit user/time; scopeId uuid or GLOBAL
- Fix: Document schema translation, org dropped, custom stored keys, migration 0119 existence, no data migration but settings effectiveness

## G2-14-021-001  [P1] GAP  facet F01  effort L
- Legacy: Legacy setting rows support GLOBAL ORGANIZATION COLLEGE DEPARTMENT PROGRAM BATCH CLASS LEARNER scopes `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AppSetting.java:14-18`
- vNext now: New tenant editor supports only GLOBAL COLLEGE `src/db/schema/platform-setting-overrides.ts:5-16` `src/modules/platform-settings/admin-editor-service.ts:14-17`
- Fix: Preserve old fine-grained module setting resolution in dedicated policy store

## G2-14-021-003  [P1] GAP  facet F02  effort M
- Legacy: Legacy entity holds scopeType scopeId settingKey settingValue and BaseModel audit flags `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AppSetting.java:9-25`
- vNext now: New override row has scopeType scopeId key value version updatedBy/time `src/db/schema/platform-setting-overrides.ts:5-16`
- Fix: Map legacy IDs deleted/version and creator provenance into new model

## G2-14-021-007  [P1] GAP  facet F04  effort M
- Legacy: Legacy scopeId nullable integer for GLOBAL and numeric IDs elsewhere `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AppSetting.java:14-18`
- vNext now: New scopeId nonnull varchar GLOBAL or college UUID `src/db/schema/platform-setting-overrides.ts:5-16`
- Fix: Build deterministic integer-to-UUID mapping including global sentinel

## G2-14-021-018  [P1] GAP  facet F07  effort M
- Legacy: Legacy module conflicting duplicate values fail 503 not silent fallback `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AppSettingsService.java:114-146`
- vNext now: New PK prevents new duplicates but migration may conflict `src/db/schema/platform-setting-overrides.ts:13-16`
- Fix: Fail closed on conflicting historical module decisions before dedupe

## G2-14-021-051  [P1] GAP  facet F22  effort L
- Legacy: Legacy app_setting BaseModel integer PK, scope_type/scope_id nullable, free text value, isDeleted `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AppSetting.java:9-25`
- vNext now: New platform_setting_overrides composite PK, UUID scope string, varchar4096, version `src/db/schema/platform-setting-overrides.ts:5-16`
- Fix: Write field-by-field migration and soft-delete representation

## G2-14-021-052  [P1] GAP  facet F22  effort L
- Legacy: Legacy supports 8 scopes `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AppSetting.java:14-18`
- vNext now: New CHECK permits only GLOBAL or COLLEGE `src/db/schema/platform-setting-overrides.ts:14-16`
- Fix: Do not silently drop student/class/program overrides during transition

## G2-9-036-137  [P1] GAP  facet F22  effort L
- Legacy: Legacy app_setting also stores nonmodule runtime values like OTP, SMS, course progress `docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:73-235`
- vNext now: New platformSettingOverrides stores varchar4096 value and typed key registry `src/db/schema/platform-setting-overrides.ts:5-17`; `src/modules/platform-settings/admin-editor-service.ts:89-99`
- Fix: Audit/migrate other settings by owning consumer, never fake them as module rules.
