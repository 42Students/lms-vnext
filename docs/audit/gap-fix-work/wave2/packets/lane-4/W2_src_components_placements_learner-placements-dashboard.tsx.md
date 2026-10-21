# Work packet (wave 2): edit src/components/placements/learner-placements-dashboard.tsx

27 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u005-learner-placements-home.md

## G2-18-005-005  [P2] GAP  facet F01  effort M
- Legacy: Legacy tab active selection uses key matching pathname and swipe left/right navigation. `docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-69`
- vNext now: vNext dashboard links navigate sections but no matching swipe layout in dashboard. `src/components/placements/learner-placements-dashboard.tsx:73-130`
- Fix: Restore route tab highlight/swipe/navigation gesture only if part of accepted legacy shell.

## G2-18-005-007  [P2] GAP  facet F02  effort M
- Legacy: Legacy hero uses `.sp-next` variant backgrounds according to next tone and `sp-next__cta` large button. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:123-132`
- vNext now: vNext border-left 2px bg-primary-subtle, consistent CTA label. `src/components/placements/learner-placements-dashboard.tsx:73-101`
- Fix: Match old tone-specific hero, typographic scale and CTA width.

## G2-18-005-008  [P2] GAP  facet F02  effort S
- Legacy: Legacy Waiting on you is card `sp-panel`, heading with no count. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:134-151`
- vNext now: vNext border-bottom section heading and `N to-do items` counter. `src/components/placements/learner-placements-dashboard.tsx:112-127`
- Fix: Restore panel chrome and suppress extra count in legacy first-view mode.

## G2-18-005-009  [P2] GAP  facet F02  effort M
- Legacy: Legacy 7-day timeline uses up to four ScheduleCard components after Waiting list. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:153-161`
- vNext now: vNext dashboard includes alerts for urgent assessment/interview and week-count metrics rather than same `ScheduleCard` strip. `src/components/placements/learner-placements-dashboard.tsx:145-173`, `src/components/placements/learner-placements-dashboard.tsx:187-210`
- Fix: Render compact four-event `Next 7 days` section with exact schedule-card look and Full schedule link.

## G2-18-005-010  [P2] GAP  facet F02  effort M
- Legacy: Legacy application snapshot max four in-progress rows with RoundTrack. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:100-104`, `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:164-185`
- vNext now: vNext application funnel stage SummaryStrip and RecentPlacementActivity separate. `src/components/placements/learner-placements-dashboard.tsx:176-185`, `src/app/(authenticated)/learn/my-placements/page.tsx:341-343`
- Fix: Show up to four live application rows and round progression links, not just aggregate funnel.

## G2-18-005-013  [P2] GAP  facet F03  effort S
- Legacy: Legacy Waiting item CTA varies Reply/Register/Confirm/View drive/Fix profile. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:73-78`, `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:134-151`
- vNext now: vNext Waiting list uses `Review now` for all. `src/components/placements/learner-placements-dashboard.tsx:117-125`
- Fix: Map action verb per todo reason, retain typed href.

## G2-18-005-015  [P2] GAP  facet F03  effort M
- Legacy: Legacy Hero `Next` varies appearance by offer, register, event, placed, act, quiet. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:83-97`, `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:123-132`
- vNext now: vNext HeroPriority model shows offer/registration/fallback, one color treatment. `src/components/placements/learner-placements-dashboard.tsx:57-60`, `src/components/placements/learner-placements-dashboard.tsx:74-101`
- Fix: Apply legacy semantic tones and eyebrow labels.

## G2-18-005-019  [P2] GAP  facet F04  effort S
- Legacy: Legacy `You have an offer`, `First step`, `Congratulations`, `All caught up` eyebrow strings. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:83-97`
- vNext now: vNext HeroPriority `Offer decision due soon`, nextScheduledEvent label etc. `src/modules/placements/learner-dashboard-model.ts:110-131`, `src/components/placements/learner-placements-dashboard.tsx:78-85`
- Fix: Map legacy eyebrow text per state.

## G2-18-005-020  [P2] GAP  facet F04  effort S
- Legacy: Legacy money in LPA string `₹X LPA` with 0/empty suppression. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:83-85`
- vNext now: vNext Offer component models annual CTC INR, hero does not show amount. `src/app/(authenticated)/learn/my-placements/page.tsx:343-368`, `src/components/placements/learner-placements-dashboard.tsx:74-89`
- Fix: Render INR LPA conversion with precise rounding/unknown state.

## G2-18-005-021  [P2] GAP  facet F04  effort M
- Legacy: Legacy events label `Today`/`Tomorrow`, mode `Online` or room and bring item. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:76-89`
- vNext now: vNext date formatter and upcoming lists display IST timestamp, event href. `src/modules/placements/learner-dashboard-model.ts:66-96`, `src/components/placements/learner-placements-dashboard.tsx:187-210`
- Fix: Match relative-day and room/mode/bring copy, preserving IST.

## G2-18-005-027  [P2] GAP  facet F05  effort M
- Legacy: Legacy closingSoon drives from eligible un-applied jobs, deadline within3 days, sorted by soonest. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:66-69`, `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:76-77`
- vNext now: vNext waiting list not evidently includes closing-soon eligible drives; dashboard open-job count. `src/components/placements/learner-placements-dashboard.tsx:63-70`, `src/modules/placements/learner-dashboard-model.ts:141-146`
- Fix: Add 3-day closing-soon items with same sorting and urgency.

## G2-18-005-029  [P2] GAP  facet F05  effort S
- Legacy: Legacy application progress includes status live or offer released and limits 4. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:100-104`
- vNext now: vNext activity sections can show wider set/funnel summary. `src/components/placements/learner-placements-dashboard.tsx:176-185`, `src/app/(authenticated)/learn/my-placements/page.tsx:341-343`
- Fix: Filter to live journeys and limit four in equivalent panel.

## G2-18-005-030  [P2] GAP  facet F06  effort S
- Legacy: Legacy single Next CTA large primary Button with custom label and direct router.push. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:123-132`
- vNext now: vNext Link styled primary, label standard `View next step`. `src/components/placements/learner-placements-dashboard.tsx:94-100`
- Fix: Match copy/icon/height and preserve safe new route.

## G2-18-005-058  [P2] GAP  facet F13  effort S
- Legacy: Legacy failed state explicit Alert safe-data reassurance and retry. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:107-111`
- vNext now: vNext segmented partial alerts; missing values null, no error as zero. `src/app/(authenticated)/learn/my-placements/page.tsx:266-268`, `src/components/placements/learner-placements-dashboard.tsx:101-111`
- Fix: Give consistent top error alert for complete failure with exact language.

## G2-18-005-059  [P2] GAP  facet F13  effort M
- Legacy: Legacy no next action yields nothing view until data ready; quiet state gives `Nothing needs you right now`. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:96-112`
- vNext now: vNext safeFallback optional and no Next action says temporarily unavailable. `src/components/placements/learner-placements-dashboard.tsx:101-111`
- Fix: Distinguish genuine all-caught-up from unknown due to partial reads.

## G2-18-005-068  [P2] GAP  facet F16  effort M
- Legacy: Legacy hero large primary CTA, card layout uses `.sp-*` responsive classes. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:123-151`
- vNext now: vNext bg-primary-subtle with flex-col then row and min-h44 touch target. `src/components/placements/learner-placements-dashboard.tsx:73-101`
- Fix: Match pixel spacing at xs/sm/lg while preserving target size.

## G2-18-005-069  [P2] GAP  facet F16  effort M
- Legacy: Legacy Next7 event cards stack, max4. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:153-161`
- vNext now: vNext assessment/interview teasers stacked, without matching grid. `src/components/placements/learner-placements-dashboard.tsx:187-210`
- Fix: Render four scheduled cards with mobile column layout.

## G2-18-005-073  [P2] GAP  facet F18  effort M
- Legacy: Legacy heading sections exactly `Waiting on you`, `Next 7 days`, `Where your applications stand`, `Latest from the placement cell`. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:134-191`
- vNext now: vNext `Waiting on you`, `Application stages`, `Latest from the placement cell` plus KPI cards. `src/components/placements/learner-placements-dashboard.tsx:112-129`, `src/components/placements/learner-placements-dashboard.tsx:176-185`, `src/app/(authenticated)/learn/my-placements/page.tsx:298-307`
- Fix: Restore omitted two section labels and their row structures.

## G2-18-005-075  [P2] GAP  facet F18  effort S
- Legacy: Legacy Next hero `All caught up` message and `Update profile`. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:96-97`
- vNext now: vNext fallback `Start here`/`Stay ready` and `View next step`. `src/modules/placements/learner-dashboard-model.ts:110-132`, `src/components/placements/learner-placements-dashboard.tsx:94-111`
- Fix: Use exact all-caught-up copy only when no pending action.

## G2-18-005-081  [P2] GAP  facet F20  effort M
- Legacy: Legacy selected registration choice can suppress apply CTA and show higher studies notice. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:70-95`
- vNext now: vNext placementRegistration component and hero priority consumed registration. `src/app/(authenticated)/learn/my-placements/page.tsx:259-268`, `src/components/placements/learner-placements-dashboard.tsx:57-61`
- Fix: Map `HIGHER_STUDIES`/opted out to equivalent hero state and help CTA.

## G2-18-005-014  [P3] GAP  facet F03  effort S
- Legacy: Legacy Full schedule and All applications links with arrow icon. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:153-155`, `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:165-166`
- vNext now: vNext application stages See all applications and deep links, no matching schedule header. `src/components/placements/learner-placements-dashboard.tsx:176-185`, `src/components/placements/learner-placements-dashboard.tsx:187-210`
- Fix: Restore exact actions/headings/icons in first view.

## G2-18-005-018  [P3] GAP  facet F04  effort S
- Legacy: Legacy greets using moment hour: before12 Good morning; before17 Good afternoon; otherwise Good evening. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:19-22`
- vNext now: vNext greeting from service and `learnerPlacementHeroGreeting` with identity. `src/app/(authenticated)/learn/my-placements/page.tsx:32-33`, `src/components/placements/learner-placements-dashboard.tsx:59-61`
- Fix: Compare timezone and exact greeting against legacy IST.

## G2-18-005-031  [P3] GAP  facet F06  effort S
- Legacy: Legacy Waiting task item click opens route, no controls inline. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:134-152`
- vNext now: vNext Review now Link, priority badge. `src/components/placements/learner-placements-dashboard.tsx:117-125`
- Fix: Match row-level click target and action copy.

## G2-18-005-048  [P3] GAP  facet F10  effort M
- Legacy: Legacy company profile avatar in application rows from PlacementsCompanyAvatar. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:14-14`, `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:171-183`
- vNext now: vNext application funnel/Recent activity may not render company avatar. `src/components/placements/learner-placements-dashboard.tsx:176-185`, `src/app/(authenticated)/learn/my-placements/page.tsx:341-343`
- Fix: Add avatar where application rows restored, with safe image URLs.

## G2-18-005-063  [P3] GAP  facet F14  effort M
- Legacy: Legacy company avatar images in in-progress application list. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:14-14`, `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:171-182`
- vNext now: vNext funnel strips lack thumbnails. `src/components/placements/learner-placements-dashboard.tsx:176-185`
- Fix: Add image-backed company avatars on corresponding live application rows.

## G2-18-005-070  [P3] GAP  facet F17  effort S
- Legacy: Legacy hero section has `aria-labelledby=sp-next-title`. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:123-127`
- vNext now: vNext hero heading h2 and links but no equivalent aria-labelledby in hero div. `src/components/placements/learner-placements-dashboard.tsx:74-101`
- Fix: Add explicit hero landmark label referencing heading.

## G2-18-005-071  [P3] GAP  facet F17  effort S
- Legacy: Legacy Waiting/Week/Progress/Latest h2 ids, section landmark aria headings. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:134-151`, `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:153-187`
- vNext now: vNext sections labels Waiting/Application stages and separate notice headings. `src/components/placements/learner-placements-dashboard.tsx:112-129`, `src/components/placements/learner-placements-dashboard.tsx:176-185`, `src/app/(authenticated)/learn/my-placements/page.tsx:298-340`
- Fix: Keep accessible section titles and deep-link IDs.
