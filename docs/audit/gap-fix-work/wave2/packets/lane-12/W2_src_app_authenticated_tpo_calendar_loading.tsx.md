# Work packet (wave 2): edit src/app/(authenticated)/tpo/calendar/loading.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u012-tpo-calendar.md

## G2-5-012-069  [P2] GAP  facet F13  effort S
- Legacy: Legacy cold-load grid shows ListSkeleton six rows (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:324-327`)
- vNext now: vNext GracefulPageLoading directory shape (`src/app/(authenticated)/tpo/calendar/loading.tsx:1-3`)
- Fix: Match six-row calendar skeleton and aria text
