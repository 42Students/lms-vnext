# Work packet: edit src/modules/admin-ui/super-admin-hiring-report-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l13-u031-dashboards-reports.md

## G2-13-031-071  [P1] GAP  facet F22  effort M
- Legacy: Legacy report rows and CSV stage stats. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:267-309`
- vNext now: vNext current placement stages, joining outcomes and company rollups. `src/modules/admin-ui/super-admin-hiring-report-service.ts:29-60`, `src/modules/admin-ui/super-admin-hiring-report-model.ts:15-25`
- Fix: Document stage provenance.
