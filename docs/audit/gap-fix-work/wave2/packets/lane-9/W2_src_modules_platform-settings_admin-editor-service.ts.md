# Work packet (wave 2): edit src/modules/platform-settings/admin-editor-service.ts

23 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-settings.md, docs/audit/gap2/lane-12/l17-u029-tenant-settings.md, docs/audit/gap2/lane-14/u021-app-setting.md, docs/audit/gap2/lane-5/u024-tenant-admin-controller.md, docs/audit/gap2/lane-9/cross-settings-feature-flags.md

## G2-10-022-095  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:572-649 — Partial success reconcile after error with fresh stored snapshot.
- vNext now: src/modules/platform-settings/admin-editor-service.ts:82-119; src/components/admin/tenant-settings-editor.tsx:45-59 — Response per-item receipt then route refresh.
- Fix: Offer accurate stale/conflict merge preserving unsaved drafts

## G2-17-029-038  [P2] MISSING  facet F11  effort M
- Legacy: legacy TenantSettings.js:934 and 972-979 ORG is cleanup-only, no writers but can inspect/delete
- vNext now: vNext admin-editor-service.ts:16,53-68 only GLOBAL/COLLEGE; no ORG cleanup
- Fix: Provide read-only legacy ORG garbage cleanup route or owner-signed de-scope for redundant legacy rows

## G2-17-029-059  [P2] GAP  facet F22  effort S
- Legacy: legacy TenantSettings.js:45-68 comment explains exact scope reader, not cascade
- vNext now: vNext admin-editor-service.ts:16-17 rejects ORG and permits max31 changes per payload
- Fix: Maintain per-scope count and guard duplicate keys; document 31-key operation cap and unknown keys handling

## G2-17-029-061  [P2] MISSING  facet F23  effort M
- Legacy: legacy TenantSettings.js:416-419 ORG cleanup-only selection
- vNext now: vNext admin-editor-service.ts:16,53-68 excludes ORG altogether
- Fix: Define cleanup procedure or sign off legacy ORG rows as intentionally retired

## G2-14-021-004  [P2] GAP  facet F02  effort L
- Legacy: Legacy settings UI edits per scoped item, list and hierarchy resolved via service `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AppSettingsService.java:173-215`
- vNext now: New SA global/college settings editor with batched changes `src/modules/platform-settings/admin-editor-service.ts:69-88`
- Fix: Expose scoped overrides at supported hierarchy with inherited value indicators

## G2-14-021-005  [P2] GAP  facet F03  effort M
- Legacy: Legacy allows generic arbitrary setting keys except retired course toggles `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AppSettingsService.java:216-230`
- vNext now: New keys must be in allowlisted specs or unlisted non-operational entries `src/modules/platform-settings/admin-editor-service.ts:90-96` `src/modules/platform-settings/admin-editor-service.ts:158-190`
- Fix: Inventory every old operational key and add mapped policy definitions

## G2-14-021-008  [P2] GAP  facet F04  effort M
- Legacy: Legacy setting value TEXT unbounded `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AppSetting.java:20-24`
- vNext now: New value varchar4096 max4096 `src/db/schema/platform-setting-overrides.ts:8-9` `src/modules/platform-settings/admin-editor-service.ts:14-15`
- Fix: Handle historic values over4096 without silent truncate

## G2-14-021-009  [P2] GAP  facet F04  effort M
- Legacy: Legacy key raw string, case-sensitive, no entity max `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AppSetting.java:20-21`
- vNext now: New key max120, regex for unlisted names `src/db/schema/platform-setting-overrides.ts:8-8` `src/modules/platform-settings/admin-editor-service.ts:158-164`
- Fix: Identify keys over120 or special characters and migrate carefully

## G2-14-021-012  [P2] GAP  facet F05  effort M
- Legacy: Legacy all active rows for scope excludes soft deleted `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/AppSettingRepository.java:25-26`
- vNext now: New overrides hard-deleted, list omits absent `src/modules/platform-settings/admin-editor-service.ts:129-133`
- Fix: Retain deleted override history in audit with proper default semantics

## G2-14-021-013  [P2] GAP  facet F06  effort S
- Legacy: Legacy null scopeType defaults GLOBAL and ORG aliases ORGANIZATION `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AppSettingsService.java:251-263`
- vNext now: New strict GLOBAL/COLLEGE and explicit scopeId `src/modules/platform-settings/admin-editor-service.ts:16-17` `src/db/schema/platform-setting-overrides.ts:14-16`
- Fix: Normalize legacy ORG/empty scope before import

## G2-14-021-014  [P2] GAP  facet F06  effort M
- Legacy: Legacy getInt/getDouble accepts strings, returns caller fallback for invalid `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AppSettingsService.java:153-171`
- vNext now: New validates int/decimal as finite and in allowed bounds `src/modules/platform-settings/admin-editor-service.ts:23-32`
- Fix: Retain safe read fallback while rejecting invalid writes

## G2-14-021-016  [P2] GAP  facet F06  effort M
- Legacy: Legacy upsert can revive soft deleted row `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AppSettingsService.java:216-230`
- vNext now: New inserts/upserts override, deleted row physically absent `src/modules/platform-settings/admin-editor-service.ts:129-140`
- Fix: Maintain override restore semantics with actor/version history

## G2-14-021-023  [P2] GAP  facet F09  effort M
- Legacy: Legacy delete marks soft deleted without confirmation in service `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AppSettingsService.java:234-249`
- vNext now: New delete blank value or unlisted removal with expectedVersion `src/modules/platform-settings/admin-editor-service.ts:129-133` `src/modules/platform-settings/admin-editor-service.ts:193-216`
- Fix: Show confirm reset and current inherited effective value

## G2-14-021-024  [P2] GAP  facet F10  effort M
- Legacy: Legacy exact scope key upsert including deleted revives same row `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AppSettingsService.java:216-230`
- vNext now: New version CAS and ON CONFLICT update `src/modules/platform-settings/admin-editor-service.ts:107-140`
- Fix: Preserve effective value while recording history separately

## G2-14-021-025  [P2] GAP  facet F10  effort S
- Legacy: Legacy delete writes isDeleted true, returns false if missing `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AppSettingsService.java:234-249`
- vNext now: New delete physically removes row and reports DELETED `src/modules/platform-settings/admin-editor-service.ts:129-150`
- Fix: Define repeat reset idempotency and historical audit retrieval

## G2-14-021-036  [P2] GAP  facet F14  effort M
- Legacy: Legacy bulk grouped read intended for admin grid `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AppSettingsService.java:186-213`
- vNext now: New list limited single selected scope; no bulk import route in editor `src/modules/platform-settings/admin-editor-service.ts:69-78`
- Fix: Add scoped bulk override inspect/export to audit historical decisions

## G2-14-021-041  [P2] GAP  facet F18  effort M
- Legacy: Legacy scope labels ORGANIZATION,DEPARTMENT,PROGRAM,BATCH,CLASS,LEARNER `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AppSetting.java:14-15`
- vNext now: New enum exposes GLOBAL and COLLEGE only `src/modules/platform-settings/admin-editor-service.ts:16-17`
- Fix: Restore hierarchy label visibility where relevant

## G2-14-021-045  [P2] GAP  facet F19  effort M
- Legacy: Legacy scope-group fetch avoids N+1 per-learner lookups `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AppSettingsService.java:186-213`
- vNext now: New one scope list fast but no broad learner bulk `src/modules/platform-settings/admin-editor-service.ts:69-78`
- Fix: Use batched scope queries for learner effective grid

## G2-14-021-048  [P2] GAP  facet F20  effort M
- Legacy: Legacy deletion soft flag keeps original row `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AppSettingsService.java:234-249`
- vNext now: New physical delete resets version and history only in activity `src/modules/platform-settings/admin-editor-service.ts:129-147`
- Fix: Preserve reversible audit record of old value on reset

## G2-5-024-019  [P2] GAP  facet F06  effort M
- Legacy: Legacy settings PUT receives arbitrary map and deletes by key. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:637-763`
- vNext now: vNext PATCH versioned changes with up to 31 keys, POST/DELETE for unlisted. `src/modules/platform-settings/admin-editor-service.ts:14-17,80-95`, `src/app/api/admin/settings/overrides/route.ts:18-55`
- Fix: Map legacy editor to bounded commands and display per-key failures.

## G2-5-024-055  [P2] GAP  facet F19  effort M
- Legacy: Legacy fetches full domain list/full scoped settings, no pagination. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:139-147,637-763`
- vNext now: vNext list all but batches settings writes to max 31. `src/app/api/tenant-domains/route.ts:12-26`, `src/modules/platform-settings/admin-editor-service.ts:69-78`
- Fix: Paginate large tenant inventory and chunk staged saves explicitly.

## G2-9-036-099  [P2] GAP  facet F02  effort M
- Legacy: Old Tenant Settings has security/SMS/course/attendance/placements/caps groups `docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:73-380`
- vNext now: vNext settings uses registered LEGACY_TENANT_SETTING_MAP and no raw module booleans `src/modules/platform-settings/admin-editor-service.ts:89-99`
- Fix: Audit exact group names/order/field helper text separately on /admin/settings; do not merge with module list.

## G2-9-036-140  [P2] GAP  facet F22  effort M
- Legacy: Legacy app_setting soft delete/upsert semantics `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AppSettingsService.java:1-95`
- vNext now: vNext platformSettingOverrides deletes row to restore default, tracks version `src/modules/platform-settings/admin-editor-service.ts:129-150`
- Fix: Reconcile historical audit/default-vs-deleted representation, preserve effective value.
