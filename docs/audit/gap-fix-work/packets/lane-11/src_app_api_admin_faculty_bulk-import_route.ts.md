# Work packet: edit src/app/api/admin/faculty/bulk-import/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/superadmin-faculty-section.md

## G2-6-002-052  [P1] GAP  facet F10  effort L
- Legacy: Old bulk POST `/api/v1/faculty/bulk-validate` followed `/bulk-register` `docs/legacy-source/frontend/src/api/Services/AdminService.js:217-223` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:634-743`
- vNext now: New POST `/api/admin/faculty/bulk-import` performs creation after client parse + confirmation `src/components/admin/super-admin-faculty-bulk-import.tsx:48-74` `src/app/api/admin/faculty/bulk-import/route.ts:7-18`
- Fix: Provide explicit server duplicate/validation preview before irreversible write
