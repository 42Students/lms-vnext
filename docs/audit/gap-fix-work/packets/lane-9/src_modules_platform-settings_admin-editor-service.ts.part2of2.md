# Work packet: edit src/modules/platform-settings/admin-editor-service.ts (part 2 of 2)

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u021-app-setting.md, docs/audit/gap2/lane-5/u024-tenant-admin-controller.md

## G2-14-021-017  [P2] GAP  facet F07  effort S
- Legacy: Legacy invalid course toggle throws Courses is a core module and cannot be toggled `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AppSettingsService.java:216-220`
- vNext now: New INVALID_SETTING code if key not mapped `src/modules/platform-settings/admin-editor-service.ts:90-95`
- Fix: Render exact protected core-course warning

## G2-14-021-019  [P2] GAP  facet F07  effort M
- Legacy: Legacy scope query exceptions may return Optional.empty for generic settings `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AppSettingsService.java:91-110`
- vNext now: New editor reports per-key FAILED or storage unavailable `src/modules/platform-settings/admin-editor-service.ts:71-72` `src/modules/platform-settings/admin-editor-service.ts:149-155`
- Fix: Separate read unavailable from intentionally unset

## G2-5-024-024  [P3] GAP  facet F07  effort S
- Legacy: Legacy empty settings PUT returns 400 Empty body. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:653-654,707-708,731-732`
- vNext now: vNext Zod rejects missing changes; UI receives generic API validation. `src/modules/platform-settings/admin-editor-service.ts:14-17`, `src/app/api/admin/settings/overrides/route.ts:18-29`
- Fix: Restore field-level empty-changes guidance.
