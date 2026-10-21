# Work packet: edit src/modules/placements/college-hiring-funnel-export.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-hiring-dashboard.md

## G2-9-008-027  [P1] MISSING  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:399-400` — Export report creates full dashboard report CSV with summary/funnel/company totals
- vNext now: `src/modules/placements/college-hiring-funnel-export.ts:4-13` — Exports one company jobs stage table with global TOTAL, missing summary/funnel/company-rollup sections
- Fix: Reproduce full-section CSV body and per-company totals matching visible report

## G2-9-008-054  [P1] MISSING  facet F14  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:258-320` — Export builds single summary+funnel+company report with escaped cells
- vNext now: `src/modules/placements/college-hiring-funnel-export.ts:4-13` — CSV only one flat per-job stage table and grand total
- Fix: Recreate legacy multi-section CSV and normalized per-company subtotal section
