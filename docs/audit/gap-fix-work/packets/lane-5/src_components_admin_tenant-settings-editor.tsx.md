# Work packet: edit src/components/admin/tenant-settings-editor.tsx

18 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-settings.md, docs/audit/gap2/lane-12/l17-u029-tenant-settings.md, docs/audit/gap2/lane-5/l17-u029-tenant-settings.md

## G2-10-022-034  [P1] MISSING  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:804-849 — Dirty scope switch/add close prompts discard.
- vNext now: src/app/(authenticated)/admin/settings/page.tsx:64-71; src/components/admin/tenant-settings-editor.tsx:15-29 — Remount on scope change; add form inline.
- Fix: Guard navigation and modal closure while dirty

## G2-10-022-035  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:920-933 — Per-field required/range validators in Form.Item.
- vNext now: src/modules/platform-settings/admin-editor-service.ts:23-52; src/components/admin/tenant-settings-editor.tsx:73-87 — Server rejects invalid setting, no inline form error.
- Fix: Add per-key inline validation before submit

## G2-10-022-044  [P1] MISSING  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:508-512 — Scope switch warns unsaved edits discarded.
- vNext now: src/components/admin/tenant-settings-editor.tsx:15-29; src/app/(authenticated)/admin/settings/page.tsx:64-71 — Remount/selector lacks change warning.
- Fix: Prompt on header scope changes with dirty draft

## G2-10-022-071  [P1] MISSING  facet F15  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:148-188 — SMS template DLT wording, variables and exact match risks explained.
- vNext now: src/modules/platform-settings/legacy-setting-specs.ts:64-95; src/components/admin/tenant-settings-editor.tsx:73-87 — No full per-key DLT help.
- Fix: Show variable instructions and recipient/channel notes

## G2-10-022-108  [P1] GAP  facet F23  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1057-1084 — Legacy per-key help/default always visible.
- vNext now: src/components/admin/tenant-settings-editor.tsx:66-90 — New disclosure groups omit help.
- Fix: Restore context help before pixel clone approval

## G2-17-029-013  [P1] GAP  facet F04  effort M
- Legacy: legacy TenantSettings.js:150-187 SMS sender and three templates have placeholders and %s/{#var#} guidance
- vNext now: vNext legacy-setting-specs.ts:66-105 keys and tenant-settings-editor.tsx:76-84 textarea, no full help text
- Fix: Restore DLT variable ordering warnings and explicit active-provider instructions; avoid stale BulkSMSApps terminology

## G2-17-029-030  [P1] GAP  facet F08  effort M
- Legacy: legacy TenantSettings.js:508-515 scope switch warns discarded unsaved drafts
- vNext now: vNext tenant-settings-editor.tsx:15-24 local draft keyed by scope but no global unsaved route guard
- Fix: Add unsaved-change protection for scope/navigate/reload and pending add draft

## G2-17-029-033  [P1] GAP  facet F09  effort M
- Legacy: legacy TenantSettings.js:804-847 asks before discard on scope switch or Add modal close
- vNext now: vNext tenant-settings-editor.tsx:15-28 and other-keys.tsx:70-96 inline add; not matching guard
- Fix: Warn before discarding edited settings or unfinished add; maintain scope-change invariant

## G2-17-029-043  [P1] GAP  facet F12  effort L
- Legacy: legacy TenantSettings.js:128-145 OTP throttling settings are active runtime parameters per help
- vNext now: vNext tenant-settings-editor.tsx:63-64 discloses security overrides need separate rollout; service.ts inventory fixed values
- Fix: Verify live runtime activation, label persisted-but-inactive controls and deployment cutover owner

## G2-17-029-050  [P1] GAP  facet F17  effort M
- Legacy: legacy TenantSettings.js:445-446 useUnsavedFormGuard on settings and add modal
- vNext now: vNext tenant-settings-editor.tsx:19-29 change tracking but no route guard
- Fix: Add leave/scope/refresh beforeunload warning and alert text equivalent to legacy

## G2-17-029-056  [P1] GAP  facet F21  effort L
- Legacy: legacy TenantSettings.js:148-187 references BulkSMSApps DLT templates, cookie/domain runtime readers
- vNext now: vNext tenant-settings-editor.tsx:63-64,112 says deployment-managed auth/messaging not auto reconfigured
- Fix: Define deployment propagation for SMS provider Exotel and DLT, login/cookie rollouts; don't promise instant runtime behavior

## G2-17-029-063  [P1] GAP  facet F23  effort M
- Legacy: Legacy values actually applied by exact scope read; no inheritance. `docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:50-68`
- vNext now: vNext stored overrides require separate deployment for auth/SMS. `src/components/admin/tenant-settings-editor.tsx:112-112`, `src/modules/platform-settings/service.ts:132-151`
- Fix: Display inactive/requires-deploy flag per key.

## G2-10-022-037  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:652-665 — Invalid form toast 'Fix the highlighted values before saving'.
- vNext now: src/components/admin/tenant-settings-editor.tsx:100-100 — Generic error Alert.
- Fix: Map parse errors to highlighted field messages

## G2-17-029-025  [P2] GAP  facet F07  effort M
- Legacy: legacy TenantSettings.js:920-931 shows `Must be between X and Y` on validation
- vNext now: vNext tenant-settings-editor.tsx:85-86 shows range, admin-editor-service.ts:23-35 rejects invalid with INVALID_SETTING receipt
- Fix: Add inline field validation and equivalent exact min/max error text before network request

## G2-17-029-027  [P2] GAP  facet F07  effort S
- Legacy: legacy TenantSettings.js:641-643 partial failure shows Saved keys, Not saved key, and reload state
- vNext now: vNext tenant-settings-editor.tsx:45-56,115-119 per-key status list and red errors
- Fix: Align exact partial-save explanatory wording and ensure stale expectedVersion recovery

## G2-17-029-029  [P2] GAP  facet F08  effort S
- Legacy: legacy TenantSettings.js:625-627 `Saved N setting(s).`, 681-683 `No changes to save.`, 752 `Added key`.
- vNext now: vNext tenant-settings-editor.tsx:95-119 uses save N changed settings button + receipts; other-keys.tsx:45 success 'Setting added.'
- Fix: Match success/no-op toast text and placement, ensure no false success when overrides inactive

## G2-10-022-040  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:625-626 — Toast 'Saved N setting(s).'
- vNext now: src/components/admin/tenant-settings-editor.tsx:115-119 — Results list, no matching toast.
- Fix: Add exact success toast

## G2-10-022-041  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:682-683 — Toast 'No changes to save.'
- vNext now: src/components/admin/tenant-settings-editor.tsx:26-30,95-96 — Save disabled when clean.
- Fix: Preserve information message for attempted save
