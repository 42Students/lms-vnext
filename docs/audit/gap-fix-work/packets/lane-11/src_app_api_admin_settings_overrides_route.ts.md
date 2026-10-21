# Work packet: edit src/app/api/admin/settings/overrides/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u024-tenant-admin-controller.md

## G2-5-024-003  [P1] GAP  facet F01  effort M
- Legacy: Legacy supports GLOBAL, ORG, COLLEGE settings read, PUT and per-key delete. `docs/legacy-source/frontend/src/api/Services/TenantAdminService.js:36-52`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:695-763`
- vNext now: vNext editor only GLOBAL/COLLEGE scopes. `src/app/api/admin/settings/overrides/route.ts:8-16`, `src/modules/platform-settings/admin-editor-service.ts:16-17`
- Fix: Restore ORG settings reader/editor or record approved removal.

## G2-5-024-024  [P3] GAP  facet F07  effort S
- Legacy: Legacy empty settings PUT returns 400 Empty body. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:653-654,707-708,731-732`
- vNext now: vNext Zod rejects missing changes; UI receives generic API validation. `src/modules/platform-settings/admin-editor-service.ts:14-17`, `src/app/api/admin/settings/overrides/route.ts:18-29`
- Fix: Restore field-level empty-changes guidance.
