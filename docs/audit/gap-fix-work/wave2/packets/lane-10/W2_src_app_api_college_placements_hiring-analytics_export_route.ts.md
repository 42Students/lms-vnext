# Work packet (wave 2): edit src/app/api/college/placements/hiring-analytics/export/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-hiring-dashboard.md

## G2-9-008-028  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:315-319` — CSV filename hiring-report-YYYY-MM-DD.csv
- vNext now: `src/app/api/college/placements/hiring-analytics/export/route.ts:13-18` — Fixed filename college-placement-analytics.csv
- Fix: Restore date-stamped legacy filename
