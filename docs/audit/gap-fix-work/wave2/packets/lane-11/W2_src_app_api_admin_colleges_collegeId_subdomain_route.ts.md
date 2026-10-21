# Work packet (wave 2): edit src/app/api/admin/colleges/[collegeId]/subdomain/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-college-subdomain.md

## G2-9-031-036  [P2] GAP  facet F10  effort M
- Legacy: GET/PUT/DELETE /api/v1/superadmin/tenant/colleges/{id}/subdomain `docs/legacy-source/frontend/src/api/Services/TenantAdminService.js:6-13`
- vNext now: GET + POST action ALLOT/CHANGE/REMOVE at /api/admin/colleges/{uuid}/subdomain `src/app/api/admin/colleges/[collegeId]/subdomain/route.ts:8-26`
- Fix: Map three verbs and response in admin migration contract.
