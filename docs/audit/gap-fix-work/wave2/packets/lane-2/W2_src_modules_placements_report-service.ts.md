# Work packet (wave 2): edit src/modules/placements/report-service.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/placement-job-service.md, docs/audit/gap2/lane-3/l11-u022-tpo-reports-index.md, docs/audit/gap2/lane-8/l11-u021-tpo-report-detail.md, docs/audit/gap2/lane-8/l15-u026-placement-job-controller.md

## G2-17-012-005  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:153-231 — CSV, resume preview, history, metrics/funnel/company report.
- vNext now: src/modules/placements/report-service.ts:63-138 — TPO report workspace split from separate legacy organization service.
- Fix: Document route/section mapping and role-scoped report placement.

## G2-11-022-021  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:47-49`
- vNext now: `src/modules/placements/report-service.ts:430-447`
- Fix: Legacy placement-summary snapshot stats returned `{stats:{registered,placedUnique,acceptedUnique,offers}}`; vNext service returns `report.metrics` with studentsPlaced/studentsAccepted/acceptedOffers. Map metrics explicitly.

## G2-11-022-041  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:46-51`
- vNext now: `src/modules/placements/report-service.ts:63-118`
- Fix: Legacy client getReport(placement-summary,{}) loads snapshot asynchronously; vNext SSR getPlacementReportWorkspace(context, seasonId/jobId) queries season/college rules and fails page if missing.

## G2-11-022-068  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:46-51`
- vNext now: `src/modules/placements/report-service.ts:88-110`
- Fix: Legacy reports gallery needs one summary GET; vNext loads college policy, seasons, jobs, offers, applications, registrations and branches before rendering, affecting first paint.

## G2-11-022-073  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:12-12`
- vNext now: `src/modules/placements/report-service.ts:63-87`
- Fix: Legacy TpoHubService.getReport fetches via client API, vNext direct PostgreSQL ReportWorkspace and URL query; different failure/observability boundary.

## G2-11-022-076  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:46-49`
- vNext now: `src/modules/placements/report-service.ts:234-430`
- Fix: Legacy one report snapshot may filter academic year differently; vNext joins registrations, section branches and active season/job; reconciliation needed before comparing historic totals.

## G2-11-021-037  [P2] GAP  facet F22  effort L
- Legacy: docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:25-26 hides internal ids and docs/legacy-source/frontend/src/components/tpo/reportViews.js:25-98 displays legacy job and learner data
- vNext now: src/modules/placements/report-service.ts:11-27 reads UUID-normalized placement, offer, applicant and joining models
- Fix: Document exact legacy field→new UUID schema mapping for report and export

## G2-15-026-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:845-930 metrics, funnel and company report independently available
- vNext now: src/app/(authenticated)/admin/placements/page.tsx:72-83 operations workspace then policy; src/modules/placements/report-service.ts:63-144 report workspace separate
- Fix: Recreate hiring metrics/funnel/company report sections or direct labelled links

## G2-15-026-016  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:845-930 separate metrics/funnel/company summaries
- vNext now: src/modules/placements/report-service.ts:63-144 season report, selected college
- Fix: Provide legacy status metric/funnel/company report views and semester filters
