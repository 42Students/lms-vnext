# Work packet (wave 3): edit src/components/admin/tenant-settings-editor.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-settings.md

## G2-10-022-002  [P1] MISSING  facet F01  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:424-443,1006-1013 — User chooses GLOBAL/ORG/COLLEGE on this page.
- vNext now: src/app/(authenticated)/admin/settings/page.tsx:62-71; src/components/admin/tenant-settings-editor.tsx:15-19 — Selected header scope only; no ORG option.
- Fix: Restore scope selector incl read-only/cleanup ORG mode

## G2-10-022-015  [P1] MISSING  facet F03  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1065-1077 — Each control shows human label, raw key, high impact Tag, tooltip/help and default.
- vNext now: src/components/admin/tenant-settings-editor.tsx:73-87 — Raw key/range but no original help/default placeholder.
- Fix: Populate exact help, default and tooltip per key

## G2-10-022-033  [P1] MISSING  facet F06  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1061-1083 — Help and placeholder text on every Form.Item.
- vNext now: src/components/admin/tenant-settings-editor.tsx:73-87 — No help prose.
- Fix: Expose context-specific help and missing defaults
