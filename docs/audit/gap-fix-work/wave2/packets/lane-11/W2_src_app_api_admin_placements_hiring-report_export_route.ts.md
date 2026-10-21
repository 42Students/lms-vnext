# Work packet (wave 2): edit src/app/api/admin/placements/hiring-report/export/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-hiring-dashboard.md

## G2-10-008-066  [P2] GAP  facet F10  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:264-320` export constructs CSV Blob client-side, no server mutation
- vNext now: `src/app/api/admin/placements/hiring-report/export/route.ts:7-35` server-side GET CSV download, no DB mutation
- Fix: Preserve sections/filename, note moved server export for scale

## G2-10-008-089  [P2] GAP  facet F14  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:265-275` export status metrics include Withdrawn/Waitlisted
- vNext now: `src/app/api/admin/placements/hiring-report/export/route.ts:20-27` report includes both at company/job level but no summary metrics
- Fix: Add same status summary lines to report export
