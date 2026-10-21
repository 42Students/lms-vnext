# Work packet: edit src/app/(authenticated)/admin/tenants/create/page.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-tenants.md

## G2-10-023-004  [P1] GAP  facet F01  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:83-90 — Creating college auto-selects it and jumps identity tab.
- vNext now: src/components/admin/college-create-form.tsx:50-90; src/app/(authenticated)/admin/tenants/create/page.tsx:54-58 — Separate create stage; says select college manually.
- Fix: After create select scoped college and move directly to Launch setup

## G2-10-023-029  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:77-90 — After organization create, keep orgId as College default without changing selected scope.
- vNext now: src/app/(authenticated)/admin/tenants/create/page.tsx:34-50 — preferredId taken URL/authorized organization list, not local last-created id.
- Fix: Wire onCreated org to College form prefill on same page

## G2-10-023-030  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:81-90 — After college create, select college and jump identity.
- vNext now: src/app/(authenticated)/admin/tenants/create/page.tsx:54-58 — User told to select manually.
- Fix: Auto-select with existing scope action and route to launch

## G2-10-023-052  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:87-122 — createCollege payload includes code/org/address; success selects scope.
- vNext now: src/components/admin/college-create-form.tsx:50-90; src/app/(authenticated)/admin/tenants/create/page.tsx:34-58 — New POST and redirect, no explicit automatic admin scope switch.
- Fix: Preserve selected tenant transition

## G2-10-023-061  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:81-90 — New college auto-selects then setup identity tab.
- vNext now: src/app/(authenticated)/admin/tenants/create/page.tsx:54-58 — Manual scope selection required.
- Fix: Implement automatic scope transition

## G2-10-023-102  [P1] GAP  facet F22  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:81-90 — Last-created org local state and current selectedCollegeId context.
- vNext now: src/app/(authenticated)/admin/tenants/create/page.tsx:36-50; src/app/(authenticated)/admin/tenants/setup/page.tsx:46-48 — Preferred org URL and server scope; no coupling.
- Fix: Implement transactional next-step state/provenance

## G2-10-023-105  [P1] GAP  facet F23  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:93-208 — One integrated workflow.
- vNext now: src/app/(authenticated)/admin/tenants/page.tsx:53-65; src/app/(authenticated)/admin/tenants/setup/page.tsx:79-179; src/app/(authenticated)/admin/tenants/create/page.tsx:38-59 — New split directory/create/setup stages.
- Fix: Reintegrate stage flow or provide exact in-context parity

## G2-10-023-041  [P2] MISSING  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:88-90 — On auto-select failure toast: 'College created, but couldn't auto-select it — pick it from the header.'
- vNext now: src/app/(authenticated)/admin/tenants/create/page.tsx:54-58 — No automatic scope selection or fallback toast.
- Fix: Implement fallback if scope update fails
