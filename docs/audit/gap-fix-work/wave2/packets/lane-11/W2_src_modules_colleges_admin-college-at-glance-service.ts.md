# Work packet (wave 2): edit src/modules/colleges/admin-college-at-glance-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-dashboard.md, docs/audit/gap2/lane-9/superadmin-dashboard.md

## G2-10-005-069  [P2] GAP  facet F22  effort M
- Legacy: Old glance maps studentCount facultyCount courseCount activeDriveCount `docs/legacy-source/frontend/src/components/admin/dashboard/AtAGlance.js:54-59`
- vNext now: New service exposes students faculty courses activeDrives with active membership/active user filter `src/modules/colleges/admin-college-at-glance-service.ts:22-38`
- Fix: Verify old AdminService count predicates vs new active filters and map field names explicitly

## G2-9-035-069  [P2] GAP  facet F22  effort M
- Legacy: Old glance maps studentCount facultyCount courseCount activeDriveCount `docs/legacy-source/frontend/src/components/admin/dashboard/AtAGlance.js:54-59`
- vNext now: New service exposes students faculty courses activeDrives with active membership/active user filter `src/modules/colleges/admin-college-at-glance-service.ts:22-38`
- Fix: Verify old AdminService count predicates vs new active filters and map field names explicitly
