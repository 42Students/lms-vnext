# Work packet (wave 3): edit src/db/schema/platform-setting-overrides.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-settings.md

## G2-10-022-057  [P1] MISSING  facet F11  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:972-979 — ORG allows cleanup but not new writes.
- vNext now: src/modules/platform-settings/admin-editor-service.ts:16-17; src/db/schema/platform-setting-overrides.ts:13-16 — ORG not permitted by service/DB.
- Fix: Provide separately guarded cleanup path or migration plan

## G2-10-022-101  [P1] MISSING  facet F22  effort L
- Legacy: docs/legacy-source/frontend/src/api/Services/TenantAdminService.js:36-43 — ORG keys can exist for cleanup even if unused.
- vNext now: src/db/schema/platform-setting-overrides.ts:13-16 — Constraint rejects ORG entirely.
- Fix: Plan historical ORG-row audit/delete or explicit archival migration
