# Work packet: edit src/app/(authenticated)/admin/settings/page.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-settings.md, docs/audit/gap2/lane-2/admin-sms-log-controller.md, docs/audit/gap2/lane-5/u024-tenant-admin-controller.md

## G2-10-022-013  [P1] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:972-979 — ORG scope warning 'No setting applies at organization level'.
- vNext now: src/app/(authenticated)/admin/settings/page.tsx:62-71 — ORG not rendered.
- Fix: Expose warning in cleanup-only ORG mode

## G2-10-022-026  [P1] MISSING  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1006-1013 — Three scope modes incl ORG unused label.
- vNext now: src/app/(authenticated)/admin/settings/page.tsx:62-71; src/modules/platform-settings/admin-editor-service.ts:16-17 — Two-mode editing only.
- Fix: Show ORG unused option with read-only cleaning

## G2-10-022-034  [P1] MISSING  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:804-849 — Dirty scope switch/add close prompts discard.
- vNext now: src/app/(authenticated)/admin/settings/page.tsx:64-71; src/components/admin/tenant-settings-editor.tsx:15-29 — Remount on scope change; add form inline.
- Fix: Guard navigation and modal closure while dirty

## G2-10-022-044  [P1] MISSING  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:508-512 — Scope switch warns unsaved edits discarded.
- vNext now: src/components/admin/tenant-settings-editor.tsx:15-29; src/app/(authenticated)/admin/settings/page.tsx:64-71 — Remount/selector lacks change warning.
- Fix: Prompt on header scope changes with dirty draft

## G2-10-022-047  [P1] MISSING  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:804-825 — Scope dropdown change with dirty edits opens confirm.
- vNext now: src/app/(authenticated)/admin/settings/page.tsx:62-71 — No internal scope dropdown.
- Fix: Restore pre-switch confirm

## G2-2-024-001  [P1] MISSING  facet F01  effort M
- Legacy: AdminSmsLogController.java:33-38 GET /api/v1/admin/sms-log
- vNext now: src/app/(authenticated)/admin/settings/page.tsx:198-210 has SMS source templates only; no sms-log route in /admin
- Fix: Add Super Admin SMS delivery-log page and API.

## G2-2-024-018  [P1] MISSING  facet F08  effort M
- Legacy: AdminSmsLogController.java:22-31 purpose answer was absence SMS actually sent?
- vNext now: src/app/(authenticated)/admin/settings/page.tsx:198-210 SMS templates, not outcomes
- Fix: Show explicit accepted/failed/unknown attempt status, not generic success.

## G2-10-022-036  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:992-1000 — Error Alert 'Settings could not be loaded or saved safely', Retry.
- vNext now: src/app/(authenticated)/admin/settings/page.tsx:52-61 — Entire route ErrorState if platform inventory fails.
- Fix: Isolate inventory from editor and show scoped Retry

## G2-5-024-028  [P3] GAP  facet F08  effort S
- Legacy: Legacy antd message notifications used for successful/failed setting actions. `docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1-38`
- vNext now: vNext uses scoped toast and banner presentation instead of legacy antd. `src/app/(authenticated)/admin/settings/page.tsx:117-124`, `src/components/admin/tenant-domain-manager.tsx:80-105`
- Fix: Compare exact toasts, placement and duration live.
