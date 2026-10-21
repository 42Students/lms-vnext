# Work packet (wave 3): edit src/app/api/admin/settings/overrides/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-settings.md

## G2-10-022-050  [P1] MISSING  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:503-555; docs/legacy-source/frontend/src/api/Services/TenantAdminService.js:24-52 — GET settings global/org/college selected by user.
- vNext now: src/app/api/admin/settings/overrides/route.ts:8-16; src/modules/platform-settings/admin-editor-service.ts:69-79 — GET accepts only GLOBAL/COLLEGE.
- Fix: Read ORG historical keys in read-only cleanup mode
