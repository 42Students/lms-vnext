# Work packet (wave 2): edit src/modules/placements/college-hiring-analytics-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-hiring-dashboard.md

## G2-9-008-024  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:329-336` — Date picker permits clearing either or both range endpoints and auto loads
- vNext now: `src/modules/placements/college-hiring-analytics-model.ts:2-13` — from/to ISO dates with strict validation and full page submit
- Fix: Preserve open-bound date semantics and update-on-change
