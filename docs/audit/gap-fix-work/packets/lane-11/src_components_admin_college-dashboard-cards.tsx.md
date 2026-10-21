# Work packet: edit src/components/admin/college-dashboard-cards.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l13-u031-dashboards-reports.md, docs/audit/gap2/lane-9/college-admin-dashboard.md

## G2-13-031-032  [P2] GAP  facet F08  effort M
- Legacy: Legacy college summary failed fetch has retry and last-good warning. `docs/legacy-source/frontend/src/components/admin/dashboard/AtAGlance.js:67-74`
- vNext now: vNext null/empty state but no local Retry. `src/components/admin/college-dashboard-cards.tsx:15-21`
- Fix: Add summary retry.

## G2-9-005-031  [P2] GAP  facet F08  effort M
- Legacy: Metric strip Retry button on failed refresh (`docs/legacy-source/frontend/src/components/admin/dashboard/AtAGlance.js:59-74`)
- vNext now: Only EmptyState on no visible cards (`src/components/admin/college-dashboard-cards.tsx:13-22`)
- Fix: Show retry for failed At a glance, preserving stale values.
