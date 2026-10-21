# Work packet (wave 2): edit src/app/(authenticated)/learn/my-placements/page.tsx

23 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u005-learner-placements-home.md

## G2-18-005-002  [P2] GAP  facet F01  effort S
- Legacy: Legacy no learnerId redirects to `/` once router ready. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:30-36`
- vNext now: vNext wrong role redirects to `/dashboard`, no active membership => permission exception. `src/app/(authenticated)/learn/my-placements/page.tsx:58-68`
- Fix: Decide legacy-compatible no-role redirect and avoid revealing page state.

## G2-18-005-003  [P2] GAP  facet F01  effort M
- Legacy: Legacy page bottom defines `PlacementsHome.placementsLayout=PlacementsTabsLayout`. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:209-209`, `docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:93-115`
- vNext now: vNext page has PageHeader and separate placement UI layout, not the old tab-slide shell. `src/app/(authenticated)/learn/my-placements/page.tsx:230-247`
- Fix: Make placement tab shell visually identical with all section labels, transitions and placement subtitle.

## G2-18-005-006  [P2] GAP  facet F02  effort L
- Legacy: Legacy first view focuses personalized Next action, Waiting on you, Next 7 days, Where applications stand, latest notices. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:24-27`, `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:116-201`
- vNext now: vNext PageHeader, debarment, registration, partial alert, Dashboard + verification, notices, activity, offers, jobs etc. `src/app/(authenticated)/learn/my-placements/page.tsx:230-343`
- Fix: Reorder first viewport to hero/Waiting/7 days/application/latest while preserving additional modules below.

## G2-18-005-010  [P2] GAP  facet F02  effort M
- Legacy: Legacy application snapshot max four in-progress rows with RoundTrack. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:100-104`, `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:164-185`
- vNext now: vNext application funnel stage SummaryStrip and RecentPlacementActivity separate. `src/components/placements/learner-placements-dashboard.tsx:176-185`, `src/app/(authenticated)/learn/my-placements/page.tsx:341-343`
- Fix: Show up to four live application rows and round progression links, not just aggregate funnel.

## G2-18-005-011  [P2] GAP  facet F02  effort S
- Legacy: Legacy Latest from placement cell closes dashboard with up to recent notices. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:187-201`
- vNext now: vNext placement cell notices and personal update list following verification section. `src/app/(authenticated)/learn/my-placements/page.tsx:298-340`
- Fix: Move notices to legacy fifth panel and preserve All notices link/copy.

## G2-18-005-020  [P2] GAP  facet F04  effort S
- Legacy: Legacy money in LPA string `₹X LPA` with 0/empty suppression. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:83-85`
- vNext now: vNext Offer component models annual CTC INR, hero does not show amount. `src/app/(authenticated)/learn/my-placements/page.tsx:343-368`, `src/components/placements/learner-placements-dashboard.tsx:74-89`
- Fix: Render INR LPA conversion with precise rounding/unknown state.

## G2-18-005-028  [P2] GAP  facet F05  effort S
- Legacy: Legacy pending profile sent-back notice appears in Waiting on you. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:71-78`
- vNext now: vNext verification cue rendered separately after Dashboard. `src/app/(authenticated)/learn/my-placements/page.tsx:221-225`, `src/app/(authenticated)/learn/my-placements/page.tsx:274-296`
- Fix: Inject latest PROFILE_SENT_BACK into actionable list with Fix profile link.

## G2-18-005-029  [P2] GAP  facet F05  effort S
- Legacy: Legacy application progress includes status live or offer released and limits 4. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:100-104`
- vNext now: vNext activity sections can show wider set/funnel summary. `src/components/placements/learner-placements-dashboard.tsx:176-185`, `src/app/(authenticated)/learn/my-placements/page.tsx:341-343`
- Fix: Filter to live journeys and limit four in equivalent panel.

## G2-18-005-032  [P2] GAP  facet F06  effort M
- Legacy: Legacy no exposed registration chooser in first fold, sends Register to placement page. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:74-75`, `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:85-87`
- vNext now: vNext `LearnerPlacementRegistration` interactive panel before dashboard. `src/app/(authenticated)/learn/my-placements/page.tsx:259-267`
- Fix: Move registration UI below hero; hero links to registration if needed.

## G2-18-005-045  [P2] GAP  facet F10  effort M
- Legacy: Legacy GET placement journey and overview in parallel, with validation. `docs/legacy-source/frontend/src/components/Placements/student/useJourney.js:18-41`
- vNext now: vNext Promise.allSettled eight reads (jobs/preferences/journey/academic/offers/requests/registration/debarment). `src/app/(authenticated)/learn/my-placements/page.tsx:69-92`
- Fix: Preserve source-specific read consistency across the hero/todo/events instead of mismatched timestamps.

## G2-18-005-057  [P2] GAP  facet F13  effort M
- Legacy: Legacy page loading displays AntD Skeleton paragraph 8 rows. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:107-113`
- vNext now: vNext async SSR page builds all reads, no same skeleton in page. `src/app/(authenticated)/learn/my-placements/page.tsx:69-92`, `src/app/(authenticated)/learn/my-placements/page.tsx:230-247`
- Fix: Build matching placements loading skeleton, preserve page header.

## G2-18-005-058  [P2] GAP  facet F13  effort S
- Legacy: Legacy failed state explicit Alert safe-data reassurance and retry. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:107-111`
- vNext now: vNext segmented partial alerts; missing values null, no error as zero. `src/app/(authenticated)/learn/my-placements/page.tsx:266-268`, `src/components/placements/learner-placements-dashboard.tsx:101-111`
- Fix: Give consistent top error alert for complete failure with exact language.

## G2-18-005-060  [P2] GAP  facet F13  effort S
- Legacy: Legacy debarment alert reason/date/next N drives plus `Think this is wrong?` link. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:116-122`
- vNext now: vNext debar alert reason/until/remaining, but no `Think this is wrong? Tell the placement cell` action in top alert. `src/app/(authenticated)/learn/my-placements/page.tsx:248-258`
- Fix: Restore appeal/help link directly on banner.

## G2-18-005-067  [P2] GAP  facet F16  effort M
- Legacy: Legacy PlacementsTabsLayout wraps PageShell, swipe navigation and sliding animation. `docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:64-115`
- vNext now: vNext page uses min-w-0 space-y, PageHeader+sections; no same transition wrapper. `src/app/(authenticated)/learn/my-placements/page.tsx:230-247`
- Fix: Restore shell paddings, slide animations and tab strip behavior.

## G2-18-005-073  [P2] GAP  facet F18  effort M
- Legacy: Legacy heading sections exactly `Waiting on you`, `Next 7 days`, `Where your applications stand`, `Latest from the placement cell`. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:134-191`
- vNext now: vNext `Waiting on you`, `Application stages`, `Latest from the placement cell` plus KPI cards. `src/components/placements/learner-placements-dashboard.tsx:112-129`, `src/components/placements/learner-placements-dashboard.tsx:176-185`, `src/app/(authenticated)/learn/my-placements/page.tsx:298-307`
- Fix: Restore omitted two section labels and their row structures.

## G2-18-005-077  [P2] GAP  facet F19  effort L
- Legacy: Legacy journey & overview 2 GET parallel + GET jobs + getApplyChecks up to100. `docs/legacy-source/frontend/src/components/Placements/student/useJourney.js:18-35`, `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:39-50`
- vNext now: vNext at least eight concurrently fetched services plus optional notice sources. `src/app/(authenticated)/learn/my-placements/page.tsx:69-92`, `src/app/(authenticated)/learn/my-placements/page.tsx:210-225`
- Fix: Bound query fanout and expensive joins, add query timers for broad college.

## G2-18-005-081  [P2] GAP  facet F20  effort M
- Legacy: Legacy selected registration choice can suppress apply CTA and show higher studies notice. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:70-95`
- vNext now: vNext placementRegistration component and hero priority consumed registration. `src/app/(authenticated)/learn/my-placements/page.tsx:259-268`, `src/components/placements/learner-placements-dashboard.tsx:57-61`
- Fix: Map `HIGHER_STUDIES`/opted out to equivalent hero state and help CTA.

## G2-18-005-084  [P2] GAP  facet F21  effort L
- Legacy: Legacy `TpoHubService` journey and overview, jobs/all API, getApplyChecks. `docs/legacy-source/frontend/src/components/Placements/student/useJourney.js:1-3`, `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:9-12`, `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:39-50`
- vNext now: vNext Drizzle services registration/jobs/offer/journey/debarment, no direct legacy REST. `src/app/(authenticated)/learn/my-placements/page.tsx:69-92`
- Fix: Record payload/status/id migration equivalence and verify eligibility rules.

## G2-18-005-086  [P2] GAP  facet F22  effort L
- Legacy: Legacy journey has applications, schedule, offers with numeric jobId/applicationId/roundId. `docs/legacy-source/frontend/src/components/Placements/student/useJourney.js:4-5`, `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:54-65`
- vNext now: vNext normalized UUID placement jobs/roles/applications/round events/offers. `src/app/(authenticated)/learn/my-placements/page.tsx:95-174`, `src/modules/placements/learner-dashboard-model.ts:6-46`
- Fix: Document old numeric id→new UUID for CTA/event deep links and round matching.

## G2-18-005-018  [P3] GAP  facet F04  effort S
- Legacy: Legacy greets using moment hour: before12 Good morning; before17 Good afternoon; otherwise Good evening. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:19-22`
- vNext now: vNext greeting from service and `learnerPlacementHeroGreeting` with identity. `src/app/(authenticated)/learn/my-placements/page.tsx:32-33`, `src/components/placements/learner-placements-dashboard.tsx:59-61`
- Fix: Compare timezone and exact greeting against legacy IST.

## G2-18-005-048  [P3] GAP  facet F10  effort M
- Legacy: Legacy company profile avatar in application rows from PlacementsCompanyAvatar. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:14-14`, `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:171-183`
- vNext now: vNext application funnel/Recent activity may not render company avatar. `src/components/placements/learner-placements-dashboard.tsx:176-185`, `src/app/(authenticated)/learn/my-placements/page.tsx:341-343`
- Fix: Add avatar where application rows restored, with safe image URLs.

## G2-18-005-071  [P3] GAP  facet F17  effort S
- Legacy: Legacy Waiting/Week/Progress/Latest h2 ids, section landmark aria headings. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:134-151`, `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:153-187`
- vNext now: vNext sections labels Waiting/Application stages and separate notice headings. `src/components/placements/learner-placements-dashboard.tsx:112-129`, `src/components/placements/learner-placements-dashboard.tsx:176-185`, `src/app/(authenticated)/learn/my-placements/page.tsx:298-340`
- Fix: Keep accessible section titles and deep-link IDs.

## G2-18-005-074  [P3] GAP  facet F18  effort S
- Legacy: Legacy urgent debar copy `Think this is wrong? Tell the placement cell`. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:116-122`
- vNext now: vNext top debar banner no same help link. `src/app/(authenticated)/learn/my-placements/page.tsx:248-258`
- Fix: Restore helper link copy and route.
