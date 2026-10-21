# Work packet (wave 2): edit src/modules/admin-ui/super-admin-hiring-report-filters-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-hiring-dashboard.md

## G2-10-008-035  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:338-351` Job dropdown starts All jobs and custom company suffix
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:72-75`,87 shows All job and only title from `src/modules/admin-ui/super-admin-hiring-report-filters-service.ts:18-19`
- Fix: Show company suffix and default All jobs wording; retain 30-char truncation

## G2-10-008-064  [P2] GAP  facet F10  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:174-209` four filter endpoints GET jobs, departments, programs, batches independently
- vNext now: `src/modules/admin-ui/super-admin-hiring-report-filters-service.ts:17-30` queries all four in Promise.all but refuses partial results
- Fix: Preserve independent filter list loading/error scope semantics
