# Work packet (wave 2): edit src/app/(authenticated)/tpo/calendar/error.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u012-tpo-calendar.md

## G2-5-012-070  [P2] GAP  facet F13  effort M
- Legacy: Legacy refresh failure retains old calendar with banner This refresh failed (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:329-331`)
- vNext now: vNext new server data/retry may replace entire page (`src/app/(authenticated)/tpo/calendar/error.tsx:1-6`)
- Fix: Preserve last good calendar on recoverable refresh error
