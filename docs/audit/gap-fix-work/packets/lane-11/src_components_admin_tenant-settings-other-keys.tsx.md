# Work packet: edit src/components/admin/tenant-settings-other-keys.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l17-u029-tenant-settings.md, docs/audit/gap2/lane-10/superadmin-settings.md

## G2-17-029-036  [P1] GAP  facet F10  effort M
- Legacy: legacy TenantSettings.js:733-762 can add any custom setting through same scope PUT
- vNext now: vNext tenant-settings-other-keys.tsx:24-48 POST separate API; stored-only and explicit no runtime reader
- Fix: Make stored-only semantics explicit in user journey and separate operationally effective overrides

## G2-10-022-038  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:733-763 — Add errors preserve modal draft, show backend detail.
- vNext now: src/components/admin/tenant-settings-other-keys.tsx:24-48 — Generic 409/other summary.
- Fix: Show key-specific invalid-scope/duplicate errors

## G2-10-022-039  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1128-1146 — Wrong-scope documented key fails with explanatory validation message.
- vNext now: src/components/admin/tenant-settings-other-keys.tsx:23-24,83-85 — Any documented key disabled from generic add.
- Fix: Show exact alternative scope when key known

## G2-17-029-026  [P2] GAP  facet F07  effort S
- Legacy: legacy TenantSettings.js:1131-1147 key validation letters/digits/._- and wrong-scope warning
- vNext now: vNext tenant-settings-other-keys.tsx:16,72-84 uses letter-first regex and separate documented-key disablement
- Fix: Reconcile leading numeral allowed in legacy; preserve wrong-scope guidance and key diagnostics

## G2-10-022-042  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:752-752 — 'Added "key".' on arbitrary add.
- vNext now: src/components/admin/tenant-settings-other-keys.tsx:44-47 — 'Setting added. Stored keys do not automatically change any runtime service.'
- Fix: Use key-specific success with secondary warning

## G2-10-022-043  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:784-784 — 'Removed "key".' on delete.
- vNext now: src/components/admin/tenant-settings-other-keys.tsx:44-47 — 'Stored setting removed.'
- Fix: Include key name in confirmation
