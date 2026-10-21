# Work packet (wave 2): edit src/components/admin/tenant-settings-editor.tsx

32 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-settings.md, docs/audit/gap2/lane-12/l17-u029-tenant-settings.md

## G2-10-022-003  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1003-1042 — Toolbar Refresh, Add setting, Save changes before form.
- vNext now: src/components/admin/tenant-settings-editor.tsx:61-99; src/components/admin/tenant-settings-other-keys.tsx:70-86 — Save after form; Add nested under other keys.
- Fix: Move scope + actions into top toolbar

## G2-10-022-006  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1003-1045 — Small Card wraps scope controls and actions.
- vNext now: src/components/admin/tenant-settings-editor.tsx:61-99 — Controls distributed among bottom of editor and hidden disclosure.
- Fix: Restore single controls Card

## G2-10-022-007  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1055-1085 — Each known group displayed in its own small Card, all visible.
- vNext now: src/components/admin/tenant-settings-editor.tsx:66-90 — Groups collapsible, only first default open.
- Fix: Default expand and style all grouped Cards

## G2-10-022-008  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1057-1084 — Textareas full width; nontext inputs half desktop.
- vNext now: src/components/admin/tenant-settings-editor.tsx:72-87 — Uniform 2-column grid regardless input type.
- Fix: Make textarea span both desktop columns

## G2-10-022-009  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1087-1107 — Other keys Table Card follows documented groups.
- vNext now: src/components/admin/tenant-settings-editor.tsx:91-93; src/components/admin/tenant-settings-other-keys.tsx:50-69 — Collapsed disclosure of vertical list.
- Fix: Restore open table card with key/action columns

## G2-10-022-021  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:273-367 — Decimal conversion threshold displays 0.15 and supports .01 increments.
- vNext now: src/components/admin/tenant-settings-editor.tsx:79-82 — Decimal type uses HTML step any.
- Fix: Use step0.01 and default placeholder 0.15

## G2-10-022-022  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:370-410 — Operational caps show suggested numeric defaults.
- vNext now: src/components/admin/tenant-settings-editor.tsx:73-87 — Ranges displayed but default placeholders absent.
- Fix: Restore numeric example placeholders

## G2-10-022-024  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:461-477 — Groups in fixed source declaration order, all visible.
- vNext now: src/components/admin/tenant-settings-editor.tsx:60-90 — Foldable groups hide detail.
- Fix: Keep every group visible by default

## G2-10-022-028  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:907-918 — Numeric int step1 and decimal step0.01.
- vNext now: src/components/admin/tenant-settings-editor.tsx:76-84 — Decimal step any.
- Fix: Set step0.01 and precision for numeric fields

## G2-10-022-031  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1024-1042 — Save changes visible before form even when unchanged.
- vNext now: src/components/admin/tenant-settings-editor.tsx:94-99 — Bottom 'Save N changed settings' disabled when untouched.
- Fix: Restore top 'Save changes' command, keep dirty prevention

## G2-10-022-045  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:688-728 — High impact confirm lists touched dangerous keys and cautions lockout.
- vNext now: src/components/admin/tenant-settings-editor.tsx:101-114 — New dialog lists all touched and deployment warning.
- Fix: Separate dangerous-key list and original warning copy

## G2-10-022-062  [P2] GAP  facet F12  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:650-684 — Changed detection trims values before deciding no-op.
- vNext now: src/components/admin/tenant-settings-editor.tsx:26-30 — Compares raw drafts, whitespace yields change.
- Fix: Normalize values before dirty compare

## G2-10-022-068  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1057-1084 — Loading grouped Cards show Ant skeleton.
- vNext now: src/components/admin/tenant-settings-editor.tsx:61-90 — Initial props synchronous; no per-card skeleton.
- Fix: Add loading and refreshing states for grouped controls

## G2-10-022-074  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1004-1043 — xs full-width scope/actions, sm selector 10/24 actions 14/24.
- vNext now: src/components/admin/tenant-settings-editor.tsx:61-99 — No same toolbar/breakpoint layout.
- Fix: Restore responsive selector and action row

## G2-10-022-075  [P2] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1057-1084 — md textarea 24/24, other fields 12/24.
- vNext now: src/components/admin/tenant-settings-editor.tsx:72-87 — All are half width desktop.
- Fix: Span textareas full

## G2-10-022-079  [P2] GAP  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1061-1078 — Form.Item help and field errors associated.
- vNext now: src/components/admin/tenant-settings-editor.tsx:73-87 — No per-key aria-describedby validation help.
- Fix: Connect help and errors via aria-describedby

## G2-10-022-089  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1055-1085 — Entire known catalog rendered in one scrollable page.
- vNext now: src/components/admin/tenant-settings-editor.tsx:66-90 — Collapsing groups reduces DOM but hides settings.
- Fix: Render equivalent full catalog without expensive reads

## G2-10-022-095  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:572-649 — Partial success reconcile after error with fresh stored snapshot.
- vNext now: src/modules/platform-settings/admin-editor-service.ts:82-119; src/components/admin/tenant-settings-editor.tsx:45-59 — Response per-item receipt then route refresh.
- Fix: Offer accurate stale/conflict merge preserving unsaved drafts

## G2-17-029-005  [P2] GAP  facet F02  effort M
- Legacy: legacy TenantSettings.js:1055-1107 renders Platform & auth, SMS, Course & progress, Attendance, Placements, Operational caps in individual Cards
- vNext now: vNext tenant-settings-editor.tsx:60-93 uses Disclosure accordions, default opens only first
- Fix: Keep all legacy named groups visible as separate cards or approved accordion parity; preserve section order and two-column fields

## G2-17-029-007  [P2] GAP  facet F03  effort M
- Legacy: legacy TenantSettings.js:1006-1042 scope dropdown, Refresh with reload icon, Add setting, Save changes with icons
- vNext now: vNext tenant-settings-editor.tsx:91-99 has Other keys disclosure and Save N changed settings; no local Refresh or scope select
- Fix: Place matching four actions in toolbar with icon affordances, keep typed safe editor semantics

## G2-17-029-008  [P2] GAP  facet F03  effort M
- Legacy: legacy TenantSettings.js:1064-1077 label + monospace key + red 'high impact' Tag + help/default text
- vNext now: vNext tenant-settings-editor.tsx:73-86 warning StatusBadge and range-only helper; omits full help/default examples
- Fix: Restore help copy and placeholder for each field, red high-impact tag and spacing

## G2-17-029-011  [P2] GAP  facet F04  effort M
- Legacy: legacy TenantSettings.js:75-124 platform baseDomain/globalHost/cookieDomain/cookieSameSite/IP allowlist help and placeholders
- vNext now: vNext tenant-settings-editor.tsx:73-87 renders names/ranges but not full help; legacy-setting-specs.ts:3-65 lists keys
- Fix: Show exact hints/placeholder examples; distinguish deployment-managed settings as non-immediate

## G2-17-029-022  [P2] GAP  facet F06  effort S
- Legacy: legacy TenantSettings.js:907-918 int InputNumber step1 precision0; decimal step0.01; textarea rows3; text clearable
- vNext now: vNext tenant-settings-editor.tsx:76-84 HTML Input number step any for decimal, no placeholder and no clear icon
- Fix: Match decimal 0.01 step, blank=default, clear action and input heights

## G2-17-029-031  [P2] GAP  facet F09  effort M
- Legacy: legacy TenantSettings.js:690-725 560px Modal.confirm title 'This change affects everyone on the platform', warning icon and red confirm `I understand — save`
- vNext now: vNext tenant-settings-editor.tsx:100-114 ConfirmDialog titled 'Review high-impact tenant setting changes' with primary confirm
- Fix: Match critical warning width, icon, exact action label and danger styling, preserve rollout disclosure

## G2-17-029-044  [P2] GAP  facet F13  effort M
- Legacy: legacy TenantSettings.js:519-552 scope unavailable clears form, loading card skeleton, error retry
- vNext now: vNext admin/settings/page.tsx:43-61 and tenant-settings-editor.tsx:65 pending migration, ErrorState
- Fix: Match scope-not-ready banner, loading placeholder and backend error message at relevant section

## G2-17-029-048  [P2] GAP  facet F16  effort M
- Legacy: legacy TenantSettings.js:1004-1061 col xs24/sm10/md8 scope, xs24/md12 per form field; TextArea spans full md24
- vNext now: vNext tenant-settings-editor.tsx:72-87 grid md2 even textarea; toolbar stacks at sm
- Fix: Make textarea full width at md and restore 10/14 toolbar columns at breakpoint; verify 360/768/1280px

## G2-10-022-016  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1024-1042 — Reload/Plus/Save icons on toolbar controls.
- vNext now: src/components/admin/tenant-settings-editor.tsx:94-99; src/components/admin/tenant-settings-other-keys.tsx:84-87 — Plain button labels without icon trio.
- Fix: Restore icons and spacing

## G2-10-022-029  [P3] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:913-917 — Textarea rows3 with allowClear, per-key template placeholder.
- vNext now: src/components/admin/tenant-settings-editor.tsx:76-78 — No placeholder/clear.
- Fix: Add example text and clear button

## G2-10-022-030  [P3] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:917-918 — Text Input allowClear and key-specific placeholder.
- vNext now: src/components/admin/tenant-settings-editor.tsx:79-84 — Neither.
- Fix: Restore examples and clear icons

## G2-10-022-054  [P3] GAP  facet F10  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:479-495 — Stored numeric strings parsed into numeric Ant controls.
- vNext now: src/components/admin/tenant-settings-editor.tsx:20-22,76-84 — Raw string drafts typed number HTML.
- Fix: Normalize persisted number display

## G2-10-022-084  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1039-1041 — Button 'Save changes'.
- vNext now: src/components/admin/tenant-settings-editor.tsx:95-97 — 'Save N changed setting(s)'.
- Fix: Use source button label

## G2-10-022-086  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantSettings.js:1070-1071 — Red tag 'high impact'.
- vNext now: src/components/admin/tenant-settings-editor.tsx:74-75 — 'High impact'.
- Fix: Match lowercase casing
