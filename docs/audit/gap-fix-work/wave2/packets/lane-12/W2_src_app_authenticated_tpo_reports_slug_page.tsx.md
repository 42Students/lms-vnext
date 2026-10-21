# Work packet (wave 2): edit src/app/(authenticated)/tpo/reports/[slug]/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l11-u021-tpo-report-detail.md

## G2-11-021-002  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:161-169 has All reports return action
- vNext now: src/app/(authenticated)/tpo/reports/[slug]/page.tsx:22-28 has Back to reports only on unknown, src/app/(authenticated)/tpo/reports/unplaced/page.tsx:90-103 has no matching header return action
- Fix: Show All reports action at upper-right of each report

## G2-11-021-027  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:155-157 distinguishes Unknown report, load error and skeleton
- vNext now: src/app/(authenticated)/tpo/reports/[slug]/page.tsx:10-32 unknown state; src/app/(authenticated)/tpo/reports/unplaced/page.tsx:48-153 SSR, initial/stale states split across routes
- Fix: Match all five load/stale/empty states and retry wording

## G2-11-021-033  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/components/tpo/reportsMeta.js:3-14 defines exact report titles and help strings
- vNext now: src/app/(authenticated)/tpo/reports/unplaced/page.tsx:91-94 uses alternate unplaced description; src/app/(authenticated)/tpo/reports/[slug]/page.tsx:20-31 says Unknown report
- Fix: Restore title, subtitle, button and placeholder catalogue
