# Work packet: edit src/app/(authenticated)/tpo/reports/by-company/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l13-u031-dashboards-reports.md

## G2-13-031-098  [P1] GAP  facet F10  effort M
- Legacy: Legacy header CSV includes every filtered report row and display column label. `docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:134-135`
- vNext now: vNext by-company export can be visible-company subset. `src/app/(authenticated)/tpo/reports/by-company/page.tsx:66-82`
- Fix: Add full filtered CSV option alongside visible-only.
