# Work packet: edit src/app/(authenticated)/admin/tenants/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-tenants.md

## G2-10-023-001  [P1] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/tenants.js:6-18 — Tenant Setup opens global /superadmin/tenants with two tabs on same page.
- vNext now: src/app/(authenticated)/admin/tenants/page.tsx:19-64 — /admin/tenants opens directory with links to /setup and /create.
- Fix: Open legacy two-tab setup at landing route; directory secondary

## G2-10-023-105  [P1] GAP  facet F23  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:93-208 — One integrated workflow.
- vNext now: src/app/(authenticated)/admin/tenants/page.tsx:53-65; src/app/(authenticated)/admin/tenants/setup/page.tsx:79-179; src/app/(authenticated)/admin/tenants/create/page.tsx:38-59 — New split directory/create/setup stages.
- Fix: Reintegrate stage flow or provide exact in-context parity
