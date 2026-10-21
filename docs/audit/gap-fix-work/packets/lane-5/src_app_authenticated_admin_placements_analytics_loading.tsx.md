# Work packet: edit src/app/(authenticated)/admin/placements/analytics/loading.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-hiring-dashboard.md

## G2-10-008-057  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:416-425` Refreshing hiring dashboard… inline RefreshStatus
- vNext now: `src/app/(authenticated)/admin/placements/analytics/loading.tsx:1-3` route skeleton only; `src/app/(authenticated)/admin/placements/analytics/page.tsx:88` GET Refresh
- Fix: Use inline refresh state without hiding last good charts
