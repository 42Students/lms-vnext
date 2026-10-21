# Work packet (wave 2): edit src/app/(authenticated)/admin/placements/analytics/loading.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-hiring-dashboard.md

## G2-10-008-079  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:428-434` loading skeleton 6 metrics and defensive no-data message
- vNext now: `src/app/(authenticated)/admin/placements/analytics/loading.tsx:1-3` has generic directory skeleton, `src/app/(authenticated)/admin/placements/analytics/page.tsx:109-111` lacks separated skeleton
- Fix: Show legacy DashboardSkeleton metrics6 and no-data fallback
