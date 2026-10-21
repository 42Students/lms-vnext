# Work packet: edit src/app/(authenticated)/tpo/reports/unplaced/page.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l13-u031-dashboards-reports.md, docs/audit/gap2/lane-8/l11-u021-tpo-report-detail.md

## G2-13-031-085  [P1] GAP  facet F04  effort M
- Legacy: Legacy unplacedReady needs resume, CGPA, 10th%, registration and no placed-status offer. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:96-101`
- vNext now: vNext unplaced total is a different, broader population. `src/app/(authenticated)/tpo/reports/unplaced/page.tsx:107-115`
- Fix: Add distinct ready-unplaced metric and academic fields.

## G2-11-021-007  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/reportViews.js:50-59 unplaced Resume field is Uploaded or Missing
- vNext now: src/app/(authenticated)/tpo/reports/unplaced/page.tsx:146-151 hardcodes Not confirmed
- Fix: Read verified resume evidence; do not hardcode unavailable

## G2-11-021-016  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:62-69 warns Could not load batches and :177-182 offers Retry batches
- vNext now: src/app/(authenticated)/tpo/reports/unplaced/page.tsx:61-69 awaits batches without separate error banner
- Fix: Keep report usable when batch options fail with explicit retry

## G2-11-021-017  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:94-95 says Could not load the report; :155-157 PanelError/Retry
- vNext now: src/app/(authenticated)/tpo/reports/unplaced/page.tsx:56-66 awaits service and falls back to route-level error
- Fix: Create in-page Retry with original wording

## G2-11-021-018  [P2] GAP  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:170-171 shows Refreshing report and stale-error Alert retaining previous data
- vNext now: src/app/(authenticated)/tpo/reports/unplaced/page.tsx:48-153 full SSR refresh cannot keep last good snapshot in same UI
- Fix: Preserve previous result on refresh failure, label stale
