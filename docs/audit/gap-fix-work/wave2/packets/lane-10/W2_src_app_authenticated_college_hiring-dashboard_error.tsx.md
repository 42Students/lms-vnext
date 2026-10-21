# Work packet (wave 2): edit src/app/(authenticated)/college/hiring-dashboard/error.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-hiring-dashboard.md

## G2-9-008-052  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:428-435` — Six-card skeleton; no-data Empty defensive case
- vNext now: `src/app/(authenticated)/college/hiring-dashboard/error.tsx:5-10` — Graceful full route retry fallback only
- Fix: Show progress skeleton before new report dataset arrives
