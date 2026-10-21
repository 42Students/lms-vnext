# Work packet (wave 3): edit src/modules/platform-settings/admin-editor-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-settings.md

## G2-10-022-050  [P1] MISSING  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:503-555; docs/legacy-source/frontend/src/api/Services/TenantAdminService.js:24-52 — GET settings global/org/college selected by user.
- vNext now: src/app/api/admin/settings/overrides/route.ts:8-16; src/modules/platform-settings/admin-editor-service.ts:69-79 — GET accepts only GLOBAL/COLLEGE.
- Fix: Read ORG historical keys in read-only cleanup mode

## G2-10-022-057  [P1] MISSING  facet F11  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:972-979 — ORG allows cleanup but not new writes.
- vNext now: src/modules/platform-settings/admin-editor-service.ts:16-17; src/db/schema/platform-setting-overrides.ts:13-16 — ORG not permitted by service/DB.
- Fix: Provide separately guarded cleanup path or migration plan

## G2-10-022-107  [P1] MISSING  facet F23  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:972-979 — Existing unused ORG keys visible and removable, new ORG denied.
- vNext now: src/app/(authenticated)/admin/settings/page.tsx:62-71; src/modules/platform-settings/admin-editor-service.ts:16-17 — ORG cleanup intentionally omitted.
- Fix: Offer scoped historical cleanup only
