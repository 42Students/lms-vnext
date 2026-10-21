# Work packet: edit src/modules/platform-settings/legacy-setting-specs.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-settings.md, docs/audit/gap2/lane-12/l17-u029-tenant-settings.md, docs/audit/gap2/lane-17/superadmin-lesson-content-wrapper.md

## G2-10-022-019  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:148-188 — Four SMS settings carry DLT placeholders and variable order.
- vNext now: src/modules/platform-settings/legacy-setting-specs.ts:64-95 — Key metadata only; no placeholders or help.
- Fix: Restore DLT example texts and variable ordering

## G2-10-022-071  [P1] MISSING  facet F15  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:148-188 — SMS template DLT wording, variables and exact match risks explained.
- vNext now: src/modules/platform-settings/legacy-setting-specs.ts:64-95; src/components/admin/tenant-settings-editor.tsx:73-87 — No full per-key DLT help.
- Fix: Show variable instructions and recipient/channel notes

## G2-17-029-013  [P1] GAP  facet F04  effort M
- Legacy: legacy TenantSettings.js:150-187 SMS sender and three templates have placeholders and %s/{#var#} guidance
- vNext now: vNext legacy-setting-specs.ts:66-105 keys and tenant-settings-editor.tsx:76-84 textarea, no full help text
- Fix: Restore DLT variable ordering warnings and explicit active-provider instructions; avoid stale BulkSMSApps terminology

## G2-17-029-014  [P1] GAP  facet F04  effort L
- Legacy: legacy TenantSettings.js:192-234 progress %, chat poll 3000-600000, save 5000-600000
- vNext now: vNext legacy-setting-specs.ts:108-136 typed inventory; platform-settings/service.ts:228-242 indicates some source values not configurable
- Fix: Identify exact runtime consumers for stored overrides; mark no-effect keys clearly, do not advertise active toggle

## G2-17-029-017  [P1] GAP  facet F04  effort M
- Legacy: legacy TenantSettings.js:273-365 placement overlap, duration, apply rate, stale, closing, conversion threshold/cap
- vNext now: vNext admin-editor-service.ts:97-128 validates placement overrides including duration pair; legacy-setting-specs.ts:168-267
- Fix: Provide per-key activation status and preserve low conversion decimal formatting and min/max cross-field messages

## G2-17-003-020  [P1] GAP  facet F06  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:52-61 global setting watched threshold default90, min1 max100, suffix%.
- vNext now: src/modules/platform-settings/legacy-setting-specs.ts:97-105 catalogs key as global int1..100; src/components/courses/super-admin-content-directory-page.tsx:62-65 does not render any corresponding input here.
- Fix: Restore policy field at video tab or prominent link directly to editable global settings, even without college selected.

## G2-17-003-032  [P1] GAP  facet F11  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:48-61 platform-wide video policy editable with no college selected, scopeType='GLOBAL'.
- vNext now: src/components/courses/super-admin-content-directory-page.tsx:62-65 returns early when no college; src/modules/platform-settings/legacy-setting-specs.ts:97-105 records global setting but no rendered control.
- Fix: Offer global policy on no-college screen and restrict edits to privileged Super Admin.
