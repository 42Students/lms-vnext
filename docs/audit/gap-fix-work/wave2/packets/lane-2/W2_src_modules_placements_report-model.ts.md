# Work packet (wave 2): edit src/modules/placements/report-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/placement-job-service.md, docs/audit/gap2/lane-5/l13-u031-dashboards-reports.md

## G2-17-012-048  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:187-219 — Label `avgTimeToShortlistMs` in metrics API.
- vNext now: src/modules/placements/report-model.ts:314-330 — Different field metrics aggregate.
- Fix: Restore exact average/time unit or approved migration alias.

## G2-13-031-091  [P2] GAP  facet F05  effort M
- Legacy: Legacy placement summary table groups Offer status/Offers/Students in defined order. `docs/legacy-source/frontend/src/components/tpo/reportViews.js:26-30`
- vNext now: vNext core report summary exposes job/offer/CTC totals, not status table. `src/modules/placements/report-model.ts:314-355`
- Fix: Add grouped status row projection.
