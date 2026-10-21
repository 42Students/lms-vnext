# Work packet: edit src/modules/admin-ui/super-admin-hiring-report-filters-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-hiring-dashboard.md

## G2-10-008-051  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:194-204` lists exact failing filter names in persistent warning
- vNext now: `src/modules/admin-ui/super-admin-hiring-report-filters-service.ts:17-30` Promise.all filter reads fail page as a whole; `src/app/(authenticated)/admin/placements/analytics/error.tsx:6-10` generic error boundary
- Fix: Keep available filters and show targeted failure list for jobs/departments/programs/batches

## G2-10-008-056  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:413-415` filter load warning dismissible with text Could not load [names] for filtering...
- vNext now: `src/modules/admin-ui/super-admin-hiring-report-filters-service.ts:17-30` throws/no named partial warning
- Fix: Recreate exact resource-specific warning with dismiss control
