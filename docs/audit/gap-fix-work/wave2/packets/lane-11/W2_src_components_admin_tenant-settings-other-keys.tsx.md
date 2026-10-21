# Work packet (wave 2): edit src/components/admin/tenant-settings-other-keys.tsx

21 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-settings.md, docs/audit/gap2/lane-12/l17-u029-tenant-settings.md

## G2-10-022-003  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1003-1042 — Toolbar Refresh, Add setting, Save changes before form.
- vNext now: src/components/admin/tenant-settings-editor.tsx:61-99; src/components/admin/tenant-settings-other-keys.tsx:70-86 — Save after form; Add nested under other keys.
- Fix: Move scope + actions into top toolbar

## G2-10-022-009  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1087-1107 — Other keys Table Card follows documented groups.
- vNext now: src/components/admin/tenant-settings-editor.tsx:91-93; src/components/admin/tenant-settings-other-keys.tsx:50-69 — Collapsed disclosure of vertical list.
- Fix: Restore open table card with key/action columns

## G2-10-022-010  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1110-1157 — Add setting is last/overlay modal.
- vNext now: src/components/admin/tenant-settings-other-keys.tsx:70-87 — Inline add form.
- Fix: Put add form in modal after command

## G2-10-022-025  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:850-905,1097-1104 — Other keys table columns Key, Value, Actions.
- vNext now: src/components/admin/tenant-settings-other-keys.tsx:54-69 — Vertical keyed list with Remove.
- Fix: Display tri-column table

## G2-10-022-032  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1127-1155 — Modal Key required pattern letters/digits/dot/dash/underscore, Value optional.
- vNext now: src/components/admin/tenant-settings-other-keys.tsx:16-16,70-86 — Must start letter; Add disabled for empty Value.
- Fix: Align key regex and empty-value treatment

## G2-10-022-048  [P2] MISSING  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:826-849 — Dirty add-modal close opens confirmation.
- vNext now: src/components/admin/tenant-settings-other-keys.tsx:70-87 — Inline editor cannot close.
- Fix: Reintroduce modal and dirty-close confirmation

## G2-10-022-049  [P2] GAP  facet F09  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1110-1155 — Add modal warning 'Keys are matched exactly...'
- vNext now: src/components/admin/tenant-settings-other-keys.tsx:81-83 — Inline microcopy differs.
- Fix: Use full legacy warning in modal

## G2-10-022-064  [P2] GAP  facet F12  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1110-1146 — Unknown key accepted when syntax; known wrong-scope rejected.
- vNext now: src/components/admin/tenant-settings-other-keys.tsx:70-85 — Unknown allowed but stricter first-letter pattern.
- Fix: Make validation and wrong-scope warnings explicit

## G2-10-022-077  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1110-1156 — Modal overlays main page at mobile.
- vNext now: src/components/admin/tenant-settings-other-keys.tsx:70-87 — Inline editor occupies page.
- Fix: Use modal/sheet responsive overlay

## G2-10-022-080  [P2] GAP  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1110-1157 — Modal traps focus on add, returns to Add setting.
- vNext now: src/components/admin/tenant-settings-other-keys.tsx:70-87 — Inline form without focus trap.
- Fix: Preserve add trigger focus restoration

## G2-10-022-081  [P2] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1097-1104 — Table columns and delete controls announced.
- vNext now: src/components/admin/tenant-settings-other-keys.tsx:54-69 — List buttons names 'Remove' repeated without key in accessible label.
- Fix: Name action 'Remove setting <key>'

## G2-17-029-009  [P2] GAP  facet F03  effort M
- Legacy: legacy TenantSettings.js:861-905 Other stored keys uses Key / Value / unlabeled trash icon with tooltip
- vNext now: vNext tenant-settings-other-keys.tsx:54-69 uses vertical list with visible Remove button
- Fix: Match old compact three-column table and delete-icon accessibility while keeping safe confirmations

## G2-17-029-019  [P2] GAP  facet F05  effort S
- Legacy: legacy TenantSettings.js:861-905 Other keys table sorted by key, no pagination, horizontal x600
- vNext now: vNext tenant-settings-other-keys.tsx:21-69 list sorted only by server entries order; no table pagination
- Fix: Restore alphabetical key ordering, columns, 600px overflow and stable empty label

## G2-17-029-023  [P2] GAP  facet F06  effort M
- Legacy: legacy TenantSettings.js:1127-1154 Add a setting modal requires valid key but value optional
- vNext now: vNext tenant-settings-other-keys.tsx:70-86 inline form requires nonblank value and letter-first key
- Fix: Review intentional restriction on empty-value/no-op key and match modal/validation flow if required

## G2-17-029-045  [P2] GAP  facet F13  effort S
- Legacy: legacy TenantSettings.js:1097-1105 `No other keys stored at this scope.`
- vNext now: vNext tenant-settings-other-keys.tsx:54 says `No other stored keys at this scope.`
- Fix: Restore exact empty wording and table placeholder, maintain scroll parity

## G2-17-029-053  [P2] GAP  facet F19  effort M
- Legacy: legacy TenantSettings.js:850-905 other keys all rows at once, not paged
- vNext now: vNext tenant-settings-other-keys.tsx:21-69 renders all stored rows with full value
- Fix: Ensure bounded paging or virtualization while retaining alphabetical sort and aggregate count at 10k rows

## G2-10-022-016  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1024-1042 — Reload/Plus/Save icons on toolbar controls.
- vNext now: src/components/admin/tenant-settings-editor.tsx:94-99; src/components/admin/tenant-settings-other-keys.tsx:84-87 — Plain button labels without icon trio.
- Fix: Restore icons and spacing

## G2-10-022-046  [P3] GAP  facet F09  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:764-802 — Remove modal warning for individual arbitrary key.
- vNext now: src/components/admin/tenant-settings-other-keys.tsx:89-95 — ConfirmDialog with different title/description.
- Fix: Match legacy remove wording

## G2-10-022-067  [P3] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1097-1104 — Empty other-key table 'No other keys stored at this scope.'
- vNext now: src/components/admin/tenant-settings-other-keys.tsx:54-54 — 'No other stored keys at this scope.'
- Fix: Match empty text

## G2-10-022-076  [P3] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1097-1104 — Other keys table scroll x600.
- vNext now: src/components/admin/tenant-settings-other-keys.tsx:54-69 — List stacks responsively.
- Fix: Keep table scroll for desktop parity

## G2-10-022-085  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1111-1115 — Modal 'Add a setting', button 'Add'.
- vNext now: src/components/admin/tenant-settings-other-keys.tsx:71-86 — Inline 'Add setting', button 'Add setting'.
- Fix: Restore precise modal/CTA strings
