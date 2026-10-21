# Work packet (wave 2): edit src/modules/colleges/admin-tenant-lifecycle-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-tenants.md

## G2-10-023-088  [P2] GAP  facet F19  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:180-199; docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:552-609 — Organizations and Colleges client tables page25.
- vNext now: src/app/(authenticated)/admin/tenants/page.tsx:85-113; src/modules/colleges/admin-tenant-lifecycle-model.ts:23-27 — Server tenant directory page20.
- Fix: Restore 25 page size on legacy setup lists
