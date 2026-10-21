# Work packet (wave 2): edit src/modules/placements/college-hiring-funnel-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u011-placement-job-service-impl.md, docs/audit/gap2/lane-9/college-admin-hiring-dashboard.md

## G2-14-011-008  [P2] GAP  facet F03  effort M
- Legacy: Metrics and company funnel grouped report visible via controller `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:845-930`
- vNext now: New separate college hiring funnel `src/modules/placements/college-hiring-funnel-service.ts:17-103`
- Fix: Align analytics headings and summary strips with old outputs

## G2-9-008-080  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2321-2330` — Average first shortlist time stored ms from MySQL seconds
- vNext now: `src/modules/placements/college-hiring-funnel-service.ts:42-47` — Returns averageHoursToShortlist from PG epoch/3600
- Fix: Compare rounding, timezone and missing histories across schema migration
