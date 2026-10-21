# Work packet: edit src/app/api/admin/placements/hiring-report/export/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-hiring-dashboard.md

## G2-10-008-031  [P1] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:264-319` CSV includes separate metrics summary, funnel, company and totals
- vNext now: `src/app/api/admin/placements/hiring-report/export/route.ts:20-27` exports company/detail/totals only
- Fix: Append Hiring Report Summary and Hiring Funnel sections to CSV, with matching status values

## G2-10-008-085  [P1] MISSING  facet F14  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:264-319` exports CSV sections Summary/Funnel/Company rows/Company Totals
- vNext now: `src/app/api/admin/placements/hiring-report/export/route.ts:20-27` exports company and totals only
- Fix: Restore summary/funnel CSV blocks and old section labels
