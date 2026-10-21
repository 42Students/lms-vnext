# Work packet (wave 2): edit src/app/(authenticated)/admin/tenants/create/page.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-tenants.md

## G2-10-023-060  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:77-90 — New organization prefill defaults to last-created, not safety scope.
- vNext now: src/app/(authenticated)/admin/tenants/create/page.tsx:36-50 — Preferred organization URL param; not last-created state.
- Fix: Preselect created organization for College

## G2-10-023-079  [P2] GAP  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:81-90 — On college create focus remains wizard/launch identity; auto-select.
- vNext now: src/app/(authenticated)/admin/tenants/create/page.tsx:54-58 — Manual path leaves user at create context.
- Fix: Announce selected-college scope and focus launch heading

## G2-10-023-093  [P2] MISSING  facet F20  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:83-90 — College creation failure to auto-select generates fallback.
- vNext now: src/app/(authenticated)/admin/tenants/create/page.tsx:54-58 — No auto-select step.
- Fix: Use robust fallback toast when scope selection rejects

## G2-10-023-094  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:49-52 — defaultOrgId change prefills form without changing scope.
- vNext now: src/app/(authenticated)/admin/tenants/create/page.tsx:34-50 — preferred URL parameter can change across nav.
- Fix: Avoid wiping college draft during org selection

## G2-10-023-084  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:117-121 — 'Create an organization and its colleges', explanatory next step.
- vNext now: src/app/(authenticated)/admin/tenants/create/page.tsx:43-43 — Same heading, but shorter body details.
- Fix: Restore full source intro paragraph
