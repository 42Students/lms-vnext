# Work packet (wave 2): edit src/app/(authenticated)/admin/tenants/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-tenants.md

## G2-10-023-020  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:558-572 — College search includes name/code/city/organization.
- vNext now: src/app/(authenticated)/admin/tenants/page.tsx:66-85; src/modules/colleges/admin-tenant-lifecycle-service.ts:27-29 — Directory q searches college name/code and org name, omits city.
- Fix: Include city in tenant directory search

## G2-10-023-088  [P2] GAP  facet F19  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:180-199; docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:552-609 — Organizations and Colleges client tables page25.
- vNext now: src/app/(authenticated)/admin/tenants/page.tsx:85-113; src/modules/colleges/admin-tenant-lifecycle-model.ts:23-27 — Server tenant directory page20.
- Fix: Restore 25 page size on legacy setup lists
