# Work packet (wave 2): edit src/app/api/admin/settings/overrides/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u024-tenant-admin-controller.md, docs/audit/gap2/lane-10/superadmin-settings.md

## G2-5-024-019  [P2] GAP  facet F06  effort M
- Legacy: Legacy settings PUT receives arbitrary map and deletes by key. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:637-763`
- vNext now: vNext PATCH versioned changes with up to 31 keys, POST/DELETE for unlisted. `src/modules/platform-settings/admin-editor-service.ts:14-17,80-95`, `src/app/api/admin/settings/overrides/route.ts:18-55`
- Fix: Map legacy editor to bounded commands and display per-key failures.

## G2-10-022-052  [P3] GAP  facet F10  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:733-763 — Arbitrary new key written via scoped PUT.
- vNext now: src/app/api/admin/settings/overrides/route.ts:33-43 — Separate POST add.
- Fix: Preserve add semantics/user feedback
