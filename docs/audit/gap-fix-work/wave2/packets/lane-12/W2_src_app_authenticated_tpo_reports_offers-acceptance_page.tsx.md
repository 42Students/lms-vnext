# Work packet (wave 2): edit src/app/(authenticated)/tpo/reports/offers-acceptance/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l13-u031-dashboards-reports.md

## G2-13-031-092  [P2] GAP  facet F05  effort M
- Legacy: Legacy offer acceptance defaults company rows with 7 status/rate columns. `docs/legacy-source/frontend/src/components/tpo/reportViews.js:60-64`
- vNext now: vNext defaults drive rows, company second-level disclosure. `src/app/(authenticated)/tpo/reports/offers-acceptance/page.tsx:110-135`
- Fix: Restore company grouping default.
