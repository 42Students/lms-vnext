# Work packet (wave 2): edit src/app/(authenticated)/learn/my-placements/calendar/page.tsx

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/learner-calendar-redirect.md

## G2-19-005-002  [P2] GAP  facet F01  effort S
- Legacy: Uses `PlacementsTabsLayout` around redirect skeleton `docs/legacy-source/frontend/src/pages/learn/my-placements/calendar.js:9`
- vNext now: vNext `LearnerPlacementsLayout` includes tabs and standalone Career Calendar header `src/app/(authenticated)/learn/my-placements/layout.tsx:28-35` `src/app/(authenticated)/learn/my-placements/calendar/page.tsx:21`
- Fix: Match tab selection and route transition to Schedule.

## G2-19-005-004  [P2] GAP  facet F02  effort M
- Legacy: Old calendar route never renders a calendar page; skeleton then Schedule's intro/segment/month `docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:11-14` `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:126-159`
- vNext now: vNext directly shows PageHeader then full career calendar toolbar `src/app/(authenticated)/learn/my-placements/calendar/page.tsx:21-24` `src/components/placements/learner-career-calendar.tsx:133-151`
- Fix: Render Schedule Calendar shell as canonical destination, not an additional nested heading.

## G2-19-005-006  [P2] GAP  facet F02  effort S
- Legacy: Old initial redirected skeleton has active 3 paragraph rows `docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:14`
- vNext now: vNext Suspense fallback PageLoading form count2 after async workspace fetch `src/app/(authenticated)/learn/my-placements/calendar/page.tsx:11-24`
- Fix: Make first render/transition skeleton match 3 paragraph rows and avoid blank request latency.

## G2-19-005-019  [P2] GAP  facet F06  effort S
- Legacy: Old month defaults current month via moment().startOf('month') `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:65`
- vNext now: vNext initialAnchor from current date, URL default view agenda `src/app/(authenticated)/learn/my-placements/calendar/page.tsx:19-24` `src/modules/placements/learner-career-calendar-url-model.ts:9-15`
- Fix: Use current month grid as initial selection for redirect.

## G2-19-005-038  [P2] GAP  facet F13  effort S
- Legacy: Old redirect shows Skeleton 3 rows while route settles `docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:11-14`
- vNext now: vNext PageLoading count2 only inside Suspense after workspace fetch `src/app/(authenticated)/learn/my-placements/calendar/page.tsx:11-24`
- Fix: Provide redirect transition skeleton with same density.

## G2-19-005-039  [P2] GAP  facet F13  effort M
- Legacy: Old Schedule journey failure displays warning and Retry `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:117-119`
- vNext now: vNext calendar route awaits workspace without an on-page Retry state `src/app/(authenticated)/learn/my-placements/calendar/page.tsx:10-24`
- Fix: Handle calendar read faults with Retry while preserving tab shell.

## G2-19-005-047  [P2] GAP  facet F16  effort M
- Legacy: Old loading Skeleton fits PlacementsTabsLayout, route immediately replaced `docs/legacy-source/frontend/src/pages/learn/my-placements/calendar.js:9` `docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:11-14`
- vNext now: vNext full Calendar toolbar/agenda at 375 and 768 `src/app/(authenticated)/learn/my-placements/calendar/page.tsx:21-24` `src/components/placements/learner-career-calendar.tsx:133-210`
- Fix: Match short transition and compact Schedule month responsive canvas.

## G2-19-005-053  [P2] GAP  facet F18  effort S
- Legacy: Old page Calendar redirects to view `month` labelled Calendar `docs/legacy-source/frontend/src/pages/learn/my-placements/calendar.js:4-7` `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:16-17`
- vNext now: vNext page title `Career Calendar`, default view `agenda` `src/app/(authenticated)/learn/my-placements/calendar/page.tsx:21` `src/modules/placements/learner-career-calendar-url-model.ts:9-15`
- Fix: Preserve destination label Schedule/Calendar and month-selected state.

## G2-19-005-056  [P2] GAP  facet F19  effort M
- Legacy: Old redirect issues one router replace, no duplicate page-level data read `docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:9-14`
- vNext now: vNext directly calls workspace before rendering page `src/app/(authenticated)/learn/my-placements/calendar/page.tsx:10-24`
- Fix: Avoid duplicate expensive calendar aggregation when old route is used as alias.

## G2-19-005-057  [P2] GAP  facet F19  effort L
- Legacy: Old Schedule month fetches BLOCKED extras limited to displayed month span `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:91-100`
- vNext now: vNext rounds aggregated before client month selection, then locally filtered `src/app/(authenticated)/learn/my-placements/calendar/page.tsx:11-35` `src/modules/placements/learner-career-calendar-model.ts:90-115`
- Fix: Use bounded server event retrieval and page-level cache for larger cohorts.

## G2-19-005-060  [P2] GAP  facet F20  effort S
- Legacy: Old `router.replace` avoids history entry `docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:11-13`
- vNext now: vNext different route means no redirect and adds an entry when navigating manually `src/app/(authenticated)/learn/my-placements/calendar/page.tsx:10-24`
- Fix: Preserve replace history behavior so browser Back returns to prior page.

## G2-19-005-061  [P2] GAP  facet F20  effort S
- Legacy: Old selected month state tied to current month on destination `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:65` `docs/legacy-source/frontend/src/pages/learn/my-placements/calendar.js:6`
- vNext now: vNext parser may respect incoming date/view/kind or default agenda `src/app/(authenticated)/learn/my-placements/calendar/page.tsx:13-20` `src/modules/placements/learner-career-calendar-url-model.ts:9-15`
- Fix: Normalize legacy deep-link params while preserving optional selected date when safe.

## G2-19-005-062  [P2] GAP  facet F21  effort M
- Legacy: Old wrapper depends Next router and PlacementsTabsLayout `docs/legacy-source/frontend/src/pages/learn/my-placements/calendar.js:1-9` `docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:1-14`
- vNext now: vNext uses request context, workspace service, and new calendar grid `src/app/(authenticated)/learn/my-placements/calendar/page.tsx:1-24`
- Fix: Build compatibility redirect under learner permission guard; no backend write changes.

## G2-19-005-045  [P3] GAP  facet F15  effort S
- Legacy: Old Schedule intro says placement booking produces notice `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:127-129`
- vNext now: vNext route description says upcoming placement rounds but not notice `src/app/(authenticated)/learn/my-placements/calendar/page.tsx:21`
- Fix: Preserve legacy notification expectation text on target Schedule view.
