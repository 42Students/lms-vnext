# Work packet: edit src/app/(authenticated)/tpo/reports/[slug]/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l11-u021-tpo-report-detail.md

## G2-11-021-001  [P1] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:29-35 routes any REPORTS name dynamically
- vNext now: src/app/(authenticated)/tpo/reports/[slug]/page.tsx:8-37 only handles unknown slugs, while src/app/(authenticated)/tpo/reports/page.tsx:79-165 points to independent report pages
- Fix: Restore aliases for all legacy report names including outcomes and recruiter-leads

## G2-11-021-010  [P1] GAP  facet F05  effort L
- Legacy: docs/legacy-source/frontend/src/components/tpo/reportViews.js:25-98 enumerates 11 report layouts with specific columns/charts/order
- vNext now: src/app/(authenticated)/tpo/reports/page.tsx:79-165 routes expanded gallery and src/app/(authenticated)/tpo/reports/[slug]/page.tsx:8-37 handles unknowns
- Fix: Create route-by-route mapping of legacy statuses/columns and restore missing layouts
