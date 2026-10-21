# Work packet (wave 3): edit src/app/(authenticated)/admin/settings/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-settings.md

## G2-10-022-002  [P1] MISSING  facet F01  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:424-443,1006-1013 — User chooses GLOBAL/ORG/COLLEGE on this page.
- vNext now: src/app/(authenticated)/admin/settings/page.tsx:62-71; src/components/admin/tenant-settings-editor.tsx:15-19 — Selected header scope only; no ORG option.
- Fix: Restore scope selector incl read-only/cleanup ORG mode

## G2-10-022-107  [P1] MISSING  facet F23  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:972-979 — Existing unused ORG keys visible and removable, new ORG denied.
- vNext now: src/app/(authenticated)/admin/settings/page.tsx:62-71; src/modules/platform-settings/admin-editor-service.ts:16-17 — ORG cleanup intentionally omitted.
- Fix: Offer scoped historical cleanup only
