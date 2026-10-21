# Work packet: edit src/app/(authenticated)/college/hiring-dashboard/error.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-hiring-dashboard.md

## G2-9-008-031  [P1] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:417-425` — Metrics failure message Couldn't refresh hiring metrics with last data preserved and Retry button
- vNext now: `src/app/(authenticated)/college/hiring-dashboard/error.tsx:5-10` — Whole route GracefulErrorBoundary retry; cached previous filtered results not displayed
- Fix: Preserve last matching filtered data and inline warning on failed refresh
