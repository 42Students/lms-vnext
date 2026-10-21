# Work packet (wave 2): edit src/app/(authenticated)/tpo/reports/joining-status/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l13-u031-dashboards-reports.md

## G2-13-031-093  [P2] GAP  facet F05  effort M
- Legacy: Legacy joining report defaults company and six status columns. `docs/legacy-source/frontend/src/components/tpo/reportViews.js:66-69`
- vNext now: vNext defaults drive grouping. `src/app/(authenticated)/tpo/reports/joining-status/page.tsx:90-113`
- Fix: Restore company-first table.
