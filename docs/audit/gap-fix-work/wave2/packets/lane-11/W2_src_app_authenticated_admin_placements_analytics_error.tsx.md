# Work packet (wave 2): edit src/app/(authenticated)/admin/placements/analytics/error.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-hiring-dashboard.md

## G2-10-008-091  [P3] GAP  facet F15  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:413-425` warns via inline Ant alerts, not push notifications
- vNext now: `src/app/(authenticated)/admin/placements/analytics/error.tsx:6-10` error boundary and `src/app/(authenticated)/admin/placements/analytics/page.tsx:106-108` warning banner
- Fix: Match in-page transient/closable feedback, not background notification
