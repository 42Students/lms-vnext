# Work packet (wave 2): edit src/app/(authenticated)/learn/my-placements/schedule/page.tsx

29 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/learner-placement-schedule.md, docs/audit/gap2/lane-8/learner-placement-assessments-moved.md

## G2-19-004-001  [P2] GAP  facet F01  effort S
- Legacy: Old route `/learn/my-placements/schedule` has query `ahead\|past\|month`, defaults ahead `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:16-17` `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:65-68`
- vNext now: vNext same route but query `coming\|past\|calendar`, defaults coming `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:19-21` `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:108-112`
- Fix: Honor old `?view=ahead` and `?view=month` URLs; preserve selection and canonical link.

## G2-19-004-002  [P2] GAP  facet F01  effort M
- Legacy: Old page wrapped by PlacementsTabsLayout `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:232`
- vNext now: vNext PageHeader and standalone Tabs inside authenticated Learn layout `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:104-112`
- Fix: Align placement section shell, selected sidebar/tab, page margins and route.

## G2-19-004-004  [P2] GAP  facet F02  effort M
- Legacy: Old intro paragraph then compact sp-seg switch then confirm Alert then day-grouped ScheduleCards `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:126-149`
- vNext now: vNext PageHeader, numeric alert, Tabs, date-labelled standalone articles `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:104-130`
- Fix: Restore introductory placement, segment density, and grouped day subheadings.

## G2-19-004-005  [P2] GAP  facet F02  effort M
- Legacy: Old `sp-event` cards use left date tile (month/day/weekday) and event body `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:53-74`
- vNext now: vNext one-column border-bottom article with text day label `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:119-123`
- Fix: Recreate legacy date badge and card geometry for Coming up and Past.

## G2-19-004-006  [P2] GAP  facet F02  effort L
- Legacy: Old calendar month panel and 440px day Drawer are siblings within same view `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:157-175`
- vNext now: vNext embeds entire career-calendar toolbar/grid + event Drawer `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:136-140` `src/components/placements/learner-career-calendar.tsx:133-212` `src/components/placements/learner-career-calendar.tsx:356-385`
- Fix: Match compact month widget and day-wise drawer, avoid duplicate major page headers.

## G2-19-004-009  [P2] GAP  facet F03  effort S
- Legacy: Old card actions `Join link`, `Open test`, `Can't make it?` buttons `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:90-104`
- vNext now: vNext `Join online round`, `Open test`, long `Can't make it? Ask to reschedule` disclosure `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:74-77` `src/components/placements/learner-schedule-reschedule.tsx:32-38`
- Fix: Match action copy and grouping, preserve secure new links.

## G2-19-004-010  [P2] GAP  facet F03  effort M
- Legacy: Old card color-coded chips `Expected`, `Confirmed`, `Please confirm`, `Reschedule asked` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:67-73`
- vNext now: vNext uses paragraphs `Expected`, `Booked for this round`, inline confirmation button and approved-reschedule notice `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:79-101` `src/components/placements/learner-round-confirm-attendance.tsx:14-28`
- Fix: Reproduce compact urgency/status chips and pending ask indicator.

## G2-19-004-014  [P2] GAP  facet F04  effort S
- Legacy: Legacy card has left date month abbreviation, numeric day and weekday `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:53-59`
- vNext now: vNext uses text `Today · 21 Oct` etc and no date tile `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:46-56` `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:120-123`
- Fix: Rebuild three-part date tile.

## G2-19-004-016  [P2] GAP  facet F04  effort S
- Legacy: Legacy past ScheduleCard retains relative time/endsAt range and past modifier `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:54-67`
- vNext now: vNext past shows single scheduledAt formatted, no endsAt range in row `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:144-148`
- Fix: Show start–end range where recorded and muted past treatment.

## G2-19-004-018  [P2] GAP  facet F05  effort M
- Legacy: Legacy upcoming groups by local day and emits Today/Tomorrow/Yesterday/full weekday/month captions `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:33-49` `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:144-148`
- vNext now: vNext repeats day in each article; no day group, past has no yesterday label `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:46-56` `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:119-128`
- Fix: Group dated rounds under one heading per IST day with exact labels.

## G2-19-004-020  [P2] GAP  facet F05  effort M
- Legacy: Legacy selected tab uses query `view=month` and shallow router replace `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:65-68`
- vNext now: vNext calendar tab href `?view=calendar` and nested URL calendar view state `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:108-111` `src/components/placements/learner-career-calendar.tsx:74-80`
- Fix: Map older link aliases and keep calendar month anchor stable when tabbing.

## G2-19-004-052  [P2] GAP  facet F13  effort M
- Legacy: Legacy failed journey shows warning + explicit Retry `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:117-119`
- vNext now: vNext route awaits workspace and outcomes, no explicit catch/Retry block `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:22-26` `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:104-112`
- Fix: Provide warning with Retry preserving partial available data.

## G2-19-004-053  [P2] GAP  facet F13  effort S
- Legacy: Legacy initial loading shows AntD Skeleton active paragraph rows8 `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:117-119`
- vNext now: vNext server Suspense only for calendar component, inline fallback `Calendar` `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:136-140`
- Fix: Match 8-row schedule skeleton while server data loads.

## G2-19-004-062  [P2] GAP  facet F16  effort M
- Legacy: Legacy mobile/desktop sp-event date tile and card actions CSS `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:53-107`
- vNext now: vNext border-y article stack and adaptive min-h44 buttons `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:119-128` `src/components/placements/learner-round-confirm-attendance.tsx:15-29`
- Fix: Match event date-tile geometry at 375/768/1280 while retaining 44px touch targets.

## G2-19-004-068  [P2] GAP  facet F17  effort S
- Legacy: Legacy event role links attached to job when jobId available `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:75-78`
- vNext now: vNext cards link to application detail, not specific job role page `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:119-127`
- Fix: Offer contextual job link with distinguishable role name.

## G2-19-004-069  [P2] GAP  facet F18  effort S
- Legacy: Legacy first view query `ahead` and segment label Coming up `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:16-17` `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:65-68`
- vNext now: vNext key `coming`, but label Coming up `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:19-21` `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:108-111`
- Fix: Honor legacy query aliases without changing visible tab label.

## G2-19-004-073  [P2] GAP  facet F19  effort L
- Legacy: Legacy loads journey + older interviews + deadlines via separate requests and per-month blocked dates `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:70-101`
- vNext now: vNext server fetches workspace + results in parallel, calendar derives filtered rounds `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:22-35` `src/modules/placements/learner-career-calendar-model.ts:64-88`
- Fix: Aggregate multiple sources server-side with independent failures and strict bounds.

## G2-8-6-002  [P2] GAP  facet F01  effort S
- Legacy: router.replace replaces history after router.isReady (`docs/legacy-source/frontend/src/pages/learn/my-placements/assessments.js:1-10; docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:9-15; docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-115`)
- vNext now: No router.replace; page remains at current path (`src/app/(authenticated)/learn/my-placements/assessments/page.tsx:12-79; src/modules/placements/learner-assessment-browse-service.ts:8-17; src/app/(authenticated)/learn/my-placements/schedule/page.tsx:104-115`)
- Fix: Preserve replace semantics for old links

## G2-8-6-012  [P2] GAP  facet F06  effort S
- Legacy: Original redirect is automatic, without cancel or submit (`docs/legacy-source/frontend/src/pages/learn/my-placements/assessments.js:1-10; docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:9-15; docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-115`)
- vNext now: New page requires interaction to navigate to original target (`src/app/(authenticated)/learn/my-placements/assessments/page.tsx:12-79; src/modules/placements/learner-assessment-browse-service.ts:8-17; src/app/(authenticated)/learn/my-placements/schedule/page.tsx:104-115`)
- Fix: Provide automatic alias redirect or explicitly preserve old destination link

## G2-8-6-021  [P2] GAP  facet F12  effort S
- Legacy: Always redirects to fixed destination even if no data exists (`docs/legacy-source/frontend/src/pages/learn/my-placements/assessments.js:1-10; docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:9-15; docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-115`)
- vNext now: New page content depends on persisted records (`src/app/(authenticated)/learn/my-placements/assessments/page.tsx:12-79; src/modules/placements/learner-assessment-browse-service.ts:8-17; src/app/(authenticated)/learn/my-placements/schedule/page.tsx:104-115`)
- Fix: Redirect before data reads for compatibility alias

## G2-8-6-023  [P2] GAP  facet F13  effort S
- Legacy: Ant Design Skeleton active with paragraph rows=3 (`docs/legacy-source/frontend/src/pages/learn/my-placements/assessments.js:1-10; docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:9-15; docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-115`)
- vNext now: No redirect skeleton in new page function (`src/app/(authenticated)/learn/my-placements/assessments/page.tsx:12-79; src/modules/placements/learner-assessment-browse-service.ts:8-17; src/app/(authenticated)/learn/my-placements/schedule/page.tsx:104-115`)
- Fix: Restore transitional skeleton for client redirect or switch to server redirect

## G2-8-6-027  [P2] GAP  facet F16  effort M
- Legacy: Skeleton within PageShell supports responsive tab swipe (`docs/legacy-source/frontend/src/pages/learn/my-placements/assessments.js:1-10; docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:9-15; docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-115`)
- vNext now: Replacement page uses responsive spacing and links but not old placeholder (`src/app/(authenticated)/learn/my-placements/assessments/page.tsx:12-79; src/modules/placements/learner-assessment-browse-service.ts:8-17; src/app/(authenticated)/learn/my-placements/schedule/page.tsx:104-115`)
- Fix: Compare at 375/768/1280, including skeleton and tab interactions

## G2-8-6-031  [P2] GAP  facet F19  effort M
- Legacy: Initial wrapper issues no domain DB read before replacing route (`docs/legacy-source/frontend/src/pages/learn/my-placements/assessments.js:1-10; docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:9-15; docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-115`)
- vNext now: Replacement blocks on multiple server reads (`src/app/(authenticated)/learn/my-placements/assessments/page.tsx:12-79; src/modules/placements/learner-assessment-browse-service.ts:8-17; src/app/(authenticated)/learn/my-placements/schedule/page.tsx:104-115`)
- Fix: Measure new read latency and consider lightweight legacy server redirect

## G2-8-6-032  [P2] GAP  facet F20  effort S
- Legacy: Target URL literal; old query is discarded (`docs/legacy-source/frontend/src/pages/learn/my-placements/assessments.js:1-10; docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:9-15; docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-115`)
- vNext now: New page parses optional query state, does not force target (`src/app/(authenticated)/learn/my-placements/assessments/page.tsx:12-79; src/modules/placements/learner-assessment-browse-service.ts:8-17; src/app/(authenticated)/learn/my-placements/schedule/page.tsx:104-115`)
- Fix: Preserve bookmarked hash and canonical route mapping

## G2-8-6-033  [P2] GAP  facet F20  effort S
- Legacy: router.replace prevents backward loop to old bookmark (`docs/legacy-source/frontend/src/pages/learn/my-placements/assessments.js:1-10; docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:9-15; docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-115`)
- vNext now: New page remains in history, separate navigation only (`src/app/(authenticated)/learn/my-placements/assessments/page.tsx:12-79; src/modules/placements/learner-assessment-browse-service.ts:8-17; src/app/(authenticated)/learn/my-placements/schedule/page.tsx:104-115`)
- Fix: Verify back button and redirect-loop prevention

## G2-19-004-008  [P3] GAP  facet F03  effort S
- Legacy: Old segment buttons show `Coming up (N)` count only when nonzero `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:129-135`
- vNext now: vNext tab `Coming up` without count, separate heading `Coming up (N dated)` `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:108-115`
- Fix: Show count on segment button only when nonzero, include undated appropriately.

## G2-19-004-054  [P3] GAP  facet F13  effort S
- Legacy: Legacy empty upcoming copy includes why and applications link `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:142-144`
- vNext now: vNext shorter `Nothing coming up. When a company's round is planned, it shows here.` with external link after list `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:113-129`
- Fix: Use exact reason and inline link text in empty panel.

## G2-19-004-070  [P3] GAP  facet F18  effort S
- Legacy: Legacy confirmation banner singular `One round needs` vs plural `N rounds need`, plus detailed instruction `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:124` `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:137-140`
- vNext now: vNext always `N rounds need your confirmation` and no instructions `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:33` `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:107`
- Fix: Use singular/plural exact wording and old instruction text.

## G2-19-004-072  [P3] GAP  facet F18  effort S
- Legacy: Legacy date-group header `Today · Wed D MMM` or `dddd D MMMM` `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:33-49`
- vNext now: vNext inline group label `Today · D MMM`/weekday etc `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:50-56`
- Fix: Match weekday, abbreviations and Yesterday variation.
