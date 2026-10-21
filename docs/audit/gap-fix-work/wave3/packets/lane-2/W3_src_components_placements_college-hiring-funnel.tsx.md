# Work packet (wave 3): edit src/components/placements/college-hiring-funnel.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-hiring-dashboard.md

## G2-9-008-014  [P1] MISSING  facet F04  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:560-585` — Per-company total rows pinned as Table Summary fixed bottom
- vNext now: `src/components/placements/college-hiring-funnel.tsx:116-123` — Only all-drives global totals in collapsed SummaryStrip
- Fix: Calculate and render normalized per-company group rollups as sticky table footer
