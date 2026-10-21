# Work packet (wave 3): edit src/components/admin/tenant-directory-csv-control.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-tenants.md

## G2-10-023-069  [P1] MISSING  facet F14  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Colleges.js:630-641 — Bulk input TextArea placeholder BULK_TEMPLATE; parse errors Alert.
- vNext now: src/app/(authenticated)/admin/tenants/page.tsx:55-60; src/components/admin/tenant-directory-csv-control.tsx:11-24 — New CSV export only, not import.
- Fix: Add input/template/errors for import
