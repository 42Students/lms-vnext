# Work packet (wave 2): edit src/db/schema/platform-setting-overrides.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-settings.md, docs/audit/gap2/lane-14/u021-app-setting.md

## G2-10-022-100  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AppSettingsService.java:91-100 — AppSettingRepository keyed scopeType, nullable scopeId, key, active rows.
- vNext now: src/db/schema/platform-setting-overrides.ts:5-16 — New scope_id nonnull GLOBAL string or college UUID and composite PK.
- Fix: Document legacy nullable scope and UUID mapping

## G2-14-021-008  [P2] GAP  facet F04  effort M
- Legacy: Legacy setting value TEXT unbounded `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AppSetting.java:20-24`
- vNext now: New value varchar4096 max4096 `src/db/schema/platform-setting-overrides.ts:8-9` `src/modules/platform-settings/admin-editor-service.ts:14-15`
- Fix: Handle historic values over4096 without silent truncate

## G2-14-021-009  [P2] GAP  facet F04  effort M
- Legacy: Legacy key raw string, case-sensitive, no entity max `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AppSetting.java:20-21`
- vNext now: New key max120, regex for unlisted names `src/db/schema/platform-setting-overrides.ts:8-8` `src/modules/platform-settings/admin-editor-service.ts:158-164`
- Fix: Identify keys over120 or special characters and migrate carefully

## G2-14-021-010  [P2] GAP  facet F05  effort M
- Legacy: Legacy findActiveRows newest ID first for duplicate global rows `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/AppSettingRepository.java:13-23`
- vNext now: New composite PK enforces one row per scope/key `src/db/schema/platform-setting-overrides.ts:13-16`
- Fix: Resolve historical duplicates by newest ID and validate conflicts

## G2-14-021-013  [P2] GAP  facet F06  effort S
- Legacy: Legacy null scopeType defaults GLOBAL and ORG aliases ORGANIZATION `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AppSettingsService.java:251-263`
- vNext now: New strict GLOBAL/COLLEGE and explicit scopeId `src/modules/platform-settings/admin-editor-service.ts:16-17` `src/db/schema/platform-setting-overrides.ts:14-16`
- Fix: Normalize legacy ORG/empty scope before import
