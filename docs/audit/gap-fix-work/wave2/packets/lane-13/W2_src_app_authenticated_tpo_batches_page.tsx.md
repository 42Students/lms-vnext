# Work packet (wave 2): edit src/app/(authenticated)/tpo/batches/page.tsx

26 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l13-u029-tpo-batches-index.md

## G2-13-029-003  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:163-183`
- vNext now: `src/app/(authenticated)/tpo/batches/page.tsx:98-133`
- Fix: Legacy header then PageStrip four metrics before filters; vNext filters first, metrics below detailed notices.

## G2-13-029-004  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:194-200`
- vNext now: `src/app/(authenticated)/tpo/batches/page.tsx:102-120`
- Fix: Legacy compact Input.Search+Filters button with badge and off-canvas FilterPanel; vNext full filter form/status dropdown/Disclosure and facet filters.

## G2-13-029-005  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:221-230`
- vNext now: `src/app/(authenticated)/tpo/batches/page.tsx:145-190`
- Fix: Legacy tpo-batches__grid card component with separate head/decisions/journey/footer; vNext rounded bordered list item with stacked metrics.

## G2-13-029-006  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:50-61`
- vNext now: `src/app/(authenticated)/tpo/batches/page.tsx:145-149`
- Fix: Legacy status badge top-right color and batch name link; vNext state in plain text below subtitle.

## G2-13-029-007  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:63-75`
- vNext now: `src/app/(authenticated)/tpo/batches/page.tsx:152-181`
- Fix: Legacy student/eligible/ineligible/not decided row then simple two-tone DecisionBar; vNext includes Assessed/Needs review and 4-segment metric bar.

## G2-13-029-008  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:77-87`
- vNext now: `src/app/(authenticated)/tpo/batches/page.tsx:184-190`
- Fix: Legacy primary nextStep CTA and Register by D MMM deadline together in footer; vNext last decision + action link, deadline above split.

## G2-13-029-009  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:184-187`
- vNext now: `src/app/(authenticated)/tpo/batches/page.tsx:184-188`
- Fix: Legacy global Last change info Alert with Undo action; vNext last decision shown per batch card.

## G2-13-029-011  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:26-35`
- vNext now: `src/app/(authenticated)/tpo/batches/page.tsx:153-180`
- Fix: Legacy decision bar compares eligible/ineligible to b.students; vNext bar denominates summary.assessed and includes undecided/review, counts differ for unassessed learners.

## G2-13-029-013  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:131-138`
- vNext now: `src/app/(authenticated)/tpo/batches/page.tsx:63-90`
- Fix: Legacy URL shallow q search against name/department/program then priority sort; vNext multiple server-level state/program/department/deadline/facet/sort filters.

## G2-13-029-017  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:106-118`
- vNext now: `src/app/(authenticated)/tpo/batches/page.tsx:46-60`
- Fix: Legacy accepts q via shallow router.replace without strict schema; vNext rejects duplicate query parameter and malformed status/sort with Clear filters.

## G2-13-029-018  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:195-199`
- vNext now: `src/app/(authenticated)/tpo/batches/page.tsx:103-112`
- Fix: Legacy search placeholder Search batches and filter button; vNext TpoBatchInstantSearch and fixed Select enums, label layouts differ.

## G2-13-029-024  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:241-243`
- vNext now: `src/app/(authenticated)/tpo/batches/page.tsx:102-120`
- Fix: Legacy FilterPanel modal/drawer title Filter batches, vNext Disclosure and facet filter area; keyboard Escape and close semantics differ.

## G2-13-029-025  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:147-161`
- vNext now: `src/app/(authenticated)/tpo/batches/page.tsx:184-188`
- Fix: Legacy global undo button immediate action (no modal in page), vNext UndoControl interaction and local state requires parity.

## G2-13-029-035  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:170-177`
- vNext now: `src/app/(authenticated)/tpo/batches/page.tsx:124-130`
- Fix: Legacy DashboardSkeleton four metrics until initial list; vNext full server route stalls before first render and uses loading boundary.

## G2-13-029-036  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:201-219`
- vNext now: `src/app/(authenticated)/tpo/batches/page.tsx:142-145`
- Fix: Legacy exact empty No batches yet / Batches come from Academic Setup... and No batches match this view; vNext longer No placement batches... and Clear batch filters.

## G2-13-029-037  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:189-193`
- vNext now: `src/app/(authenticated)/tpo/batches/page.tsx:121-124`
- Fix: Legacy warning N students not in any class and no placements until assigned; vNext warning refers active class only and can indicate count unavailable.

## G2-13-029-041  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:221-230`
- vNext now: `src/app/(authenticated)/tpo/batches/page.tsx:145-190`
- Fix: Legacy responsive tpo-batches__grid via SCSS vs new md:grid-cols-2 xl:grid-cols-3 card list, measure 375/768/1280.

## G2-13-029-042  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:194-200`
- vNext now: `src/app/(authenticated)/tpo/batches/page.tsx:102-113`
- Fix: Legacy compact toolbar/search remains above all metrics/cards, vNext form grid with collapsed subfilters and additional facets.

## G2-13-029-045  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:196-199`
- vNext now: `src/app/(authenticated)/tpo/batches/page.tsx:102-120`
- Fix: Legacy Filters trigger Badge count and Drawer focus, vNext filters are labeled native selects and Disclosure.

## G2-13-029-047  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:178-183`
- vNext now: `src/app/(authenticated)/tpo/batches/page.tsx:131-133`
- Fix: Legacy summary labels batches open for placements / student eligible / not decided yet / placed vs vNext Open for placements / Students eligible / Placed (offer evidence).

## G2-13-029-051  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:121-129`
- vNext now: `src/app/(authenticated)/tpo/batches/page.tsx:61-90`
- Fix: Legacy repeated refresh can race and overwrite last rendered batch data; vNext RSC request isolation but partial subquery failures produce warning counters.

## G2-13-029-054  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:143-144`
- vNext now: `src/app/(authenticated)/tpo/batches/page.tsx:184-187`
- Fix: Legacy parsePlacementUtcDateTime server last action, vNext Intl.DateTimeFormat IST for per-cohort decision; same instant but different relative text.

## G2-13-029-057  [P2] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:147-161`
- vNext now: `src/app/(authenticated)/tpo/batches/page.tsx:184-188`
- Fix: Global Last change and Undo summary banner replaced by per-batch recent decision; restore legacy global affordance if desired.

## G2-13-029-058  [P2] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:194-200`
- vNext now: `src/app/(authenticated)/tpo/batches/page.tsx:102-120`
- Fix: Legacy side FilterPanel/FilterChips missing, vNext form and facet controls need pixel clone.

## G2-13-029-059  [P2] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:221-230`
- vNext now: `src/app/(authenticated)/tpo/batches/page.tsx:145-190`
- Fix: Legacy card decision counts/journey/CTA visual grouping differs in new card.

## G2-13-029-048  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:202-209`
- vNext now: `src/app/(authenticated)/tpo/batches/page.tsx:142-145`
- Fix: Legacy No batches yet / No batches match this view and CTA text vs vNext newer empty copy.
