# Work packet (wave 2): edit src/app/(authenticated)/tpo/reports/unplaced/page.tsx

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l13-u031-dashboards-reports.md, docs/audit/gap2/lane-8/l11-u021-tpo-report-detail.md

## G2-13-031-078  [P2] GAP  facet F03  effort M
- Legacy: Old actions `Presentation view`, `All reports`, `Act on them on Students`. `docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:161-169`
- vNext now: vNext Unplaced emphasizes filtered CSV rather than Students link. `src/app/(authenticated)/tpo/reports/unplaced/page.tsx:84-89`
- Fix: Reintroduce filtered Students link plus optional fullscreen action.

## G2-11-021-002  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:161-169 has All reports return action
- vNext now: src/app/(authenticated)/tpo/reports/[slug]/page.tsx:22-28 has Back to reports only on unknown, src/app/(authenticated)/tpo/reports/unplaced/page.tsx:90-103 has no matching header return action
- Fix: Show All reports action at upper-right of each report

## G2-11-021-003  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:158-176 displays header then quiet context summary
- vNext now: src/app/(authenticated)/tpo/reports/unplaced/page.tsx:90-123 renders header/filter form/summary strip in different order
- Fix: Place old context line ahead of filter card and chart/table

## G2-11-021-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:183-219 puts filters in compact Card and chart in a separate Card
- vNext now: src/components/placements/placement-report-ui.tsx:60-125 uses border-separated filter section and src/app/(authenticated)/tpo/reports/unplaced/page.tsx:130-153 uncarded report table
- Fix: Restore old bordered card geometry and spacing

## G2-11-021-005  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:161-169 has Presentation view, All reports, conditional NAAC export and Students action
- vNext now: src/app/(authenticated)/tpo/reports/unplaced/page.tsx:95-100 has Download filtered CSV and src/components/placements/placement-report-ui.tsx:1-3 has separate presentation implementation
- Fix: Restore header actions and full-screen toggle for each applicable report

## G2-11-021-006  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:173-175 shows placedUnique/offers/placedPct/acceptedUnique
- vNext now: src/app/(authenticated)/tpo/reports/unplaced/page.tsx:118-123 instead shows unplaced and registered counts
- Fix: Show legacy context summary as separate row with correct denominators

## G2-11-021-008  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/components/tpo/reportViews.js:54-56 Marks verified uses No marks yet/Verified/Not verified and Last applied uses Never
- vNext now: src/app/(authenticated)/tpo/reports/unplaced/page.tsx:148-151 uses Not recorded for missing values
- Fix: Use source-equivalent three-state marks and no-application labels

## G2-11-021-014  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:54 and :85-117 auto-requeries after 350ms debounce
- vNext now: src/app/(authenticated)/tpo/reports/unplaced/page.tsx:100-117 requires explicit Filter submit
- Fix: Match debounce or document deliberate submit change

## G2-11-021-023  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:134-153 exports selected columns from loaded rows via client CSV
- vNext now: src/app/(authenticated)/tpo/reports/unplaced/page.tsx:87-96 uses server filtered CSV endpoint
- Fix: Verify full filtered population and no silent export row limit

## G2-11-021-027  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:155-157 distinguishes Unknown report, load error and skeleton
- vNext now: src/app/(authenticated)/tpo/reports/[slug]/page.tsx:10-32 unknown state; src/app/(authenticated)/tpo/reports/unplaced/page.tsx:48-153 SSR, initial/stale states split across routes
- Fix: Match all five load/stale/empty states and retry wording

## G2-11-021-028  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:224-256 shows exact no-chart-data and no-row messages
- vNext now: src/app/(authenticated)/tpo/reports/unplaced/page.tsx:153 has bespoke unplaced empty scope message
- Fix: Match each report empty text from legacy

## G2-11-021-031  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:158-256 compact filter row and 70vh scroll within report Card
- vNext now: src/app/(authenticated)/tpo/reports/unplaced/page.tsx:90-153 responsive stacked filter controls
- Fix: Compare 375/768/1280 dimensions and old column order

## G2-11-021-033  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/components/tpo/reportsMeta.js:3-14 defines exact report titles and help strings
- vNext now: src/app/(authenticated)/tpo/reports/unplaced/page.tsx:91-94 uses alternate unplaced description; src/app/(authenticated)/tpo/reports/[slug]/page.tsx:20-31 says Unknown report
- Fix: Restore title, subtitle, button and placeholder catalogue

## G2-11-021-034  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:49-54 seqRef discards stale request, 350ms debounce
- vNext now: src/app/(authenticated)/tpo/reports/unplaced/page.tsx:56-80 performs several server reads rather than one getReport request
- Fix: Bound multi-query latency and preserve snapshot consistency

## G2-11-021-035  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:99-116 keeps last good data after load failure
- vNext now: src/app/(authenticated)/tpo/reports/unplaced/page.tsx:48-153 server re-render discards previous result
- Fix: Distinguish failed data from zero safely and preserve filters
