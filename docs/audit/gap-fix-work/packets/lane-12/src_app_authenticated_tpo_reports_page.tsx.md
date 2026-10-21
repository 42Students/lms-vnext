# Work packet: edit src/app/(authenticated)/tpo/reports/page.tsx

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l11-u022-tpo-reports-index.md, docs/audit/gap2/lane-5/l13-u031-dashboards-reports.md, docs/audit/gap2/lane-8/l11-u021-tpo-report-detail.md

## G2-11-022-010  [P1] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:62-74`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:285-308`
- Fix: Primary interactive placement journey moved below gallery into closed disclosure and replaced with ordinary metric link boxes. Restore above cards and interactive gaps.

## G2-11-022-019  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:63-72`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:289-303`
- Fix: Legacy `acceptedUnique` is unique students accepted; vNext journey uses `acceptedOffers` offer count. Do not label unlike denominators as equivalent.

## G2-11-022-020  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:63-72`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:289-303`
- Fix: Legacy `placedUnique` uses uniqueness and Not accepted yet=placedUnique−acceptedUnique; vNext uses placed students and offers−acceptedOffers, a different gap.

## G2-11-022-077  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:62-74`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:285-308`
- Fix: Legacy immediately visible clickable JourneyStrip with gap links/percentage not present above report cards; restore exact placement while preserving provenance notes.

## G2-13-031-076  [P1] GAP  facet F01  effort M
- Legacy: Old canonical report routes `recruiter-leads` and `outcomes` are stable bookmarks. `docs/legacy-source/frontend/src/components/tpo/reportsMeta.js:9-13`
- vNext now: vNext catalog uses leads and after-college. `src/app/(authenticated)/tpo/reports/page.tsx:169-183`
- Fix: Redirect old report paths and preserve filters.

## G2-13-031-095  [P1] GAP  facet F07  effort M
- Legacy: Legacy batch-select error does not erase successfully loaded report. `docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:177-181`
- vNext now: vNext headline/workspace fetch error hides static catalog. `src/app/(authenticated)/tpo/reports/page.tsx:67-76`
- Fix: Keep catalog visible despite failed KPI or filter fetch.

## G2-13-031-096  [P1] GAP  facet F08  effort M
- Legacy: Legacy failed refresh displays last successful report and explicit stale warning. `docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:170-171`
- vNext now: vNext fetch failure replaces whole gallery. `src/app/(authenticated)/tpo/reports/page.tsx:67-76`
- Fix: Cache last-successful report, retain rows, display stale banner.

## G2-11-021-001  [P1] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:29-35 routes any REPORTS name dynamically
- vNext now: src/app/(authenticated)/tpo/reports/[slug]/page.tsx:8-37 only handles unknown slugs, while src/app/(authenticated)/tpo/reports/page.tsx:79-165 points to independent report pages
- Fix: Restore aliases for all legacy report names including outcomes and recruiter-leads

## G2-11-021-010  [P1] GAP  facet F05  effort L
- Legacy: docs/legacy-source/frontend/src/components/tpo/reportViews.js:25-98 enumerates 11 report layouts with specific columns/charts/order
- vNext now: src/app/(authenticated)/tpo/reports/page.tsx:79-165 routes expanded gallery and src/app/(authenticated)/tpo/reports/[slug]/page.tsx:8-37 handles unknowns
- Fix: Create route-by-route mapping of legacy statuses/columns and restore missing layouts

## G2-11-022-033  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:46-51`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:59-77`
- Fix: Legacy snapshot failure only shows The headline numbers could not be loaded. + Retry, still renders report gallery; vNext getPlacementReportWorkspace failure takes over page with The report is temporarily unavailable.

## G2-11-022-036  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:53-74`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:234-244`
- Fix: Legacy valid page always retains static gallery even if headline snapshot fails; vNext no-season banner and filter-specific no-match state change visibility.

## G2-11-022-034  [P3] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:61-61`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:68-74`
- Fix: Use exact legacy error title The headline numbers could not be loaded. instead of The report is temporarily unavailable, even with safe no-estimate note.

## G2-11-022-038  [P3] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:85-103`
- vNext now: `src/app/(authenticated)/tpo/reports/page.tsx:256-274`
- Fix: Legacy report opens by button push with immediate navigation; vNext SSR Link preserves season/job query; positive state has no opening toast on either.
