# Work packet (wave 2): edit src/components/placements/learner-career-calendar.tsx

34 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/l18-u021-job-important-date-event-dto.md, docs/audit/gap2/lane-19/learner-calendar-redirect.md, docs/audit/gap2/lane-19/learner-placement-schedule.md, docs/audit/gap2/lane-9/l18-u023-learner-eligibility-controller.md

## G2-18-021-002  [P2] GAP  facet F01  effort M
- Legacy: Old admin `Interview Calendar` and learner `Career calendar` (JobController:903-942)
- vNext now: New TPO/College Admin shared placement calendar, learner career-calendar (placement-calendar-service:170-185; learner-career-calendar.tsx:134-150)
- Fix: Verify both legacy calendar entry points and job-details drilldown from date events

## G2-19-005-004  [P2] GAP  facet F02  effort M
- Legacy: Old calendar route never renders a calendar page; skeleton then Schedule's intro/segment/month `docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:11-14` `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:126-159`
- vNext now: vNext directly shows PageHeader then full career calendar toolbar `src/app/(authenticated)/learn/my-placements/calendar/page.tsx:21-24` `src/components/placements/learner-career-calendar.tsx:133-151`
- Fix: Render Schedule Calendar shell as canonical destination, not an additional nested heading.

## G2-19-005-005  [P2] GAP  facet F02  effort L
- Legacy: Old Schedule month view has one month bar/legend/day Drawer `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:180-228`
- vNext now: vNext career-calendar has larger toolbar, filters, month totals, agenda and event Drawer `src/components/placements/learner-career-calendar.tsx:133-221` `src/components/placements/learner-career-calendar.tsx:308-385`
- Fix: Match placement canvas density, one month header and old legend.

## G2-19-005-008  [P2] GAP  facet F03  effort M
- Legacy: Old Schedule segmented buttons Coming up/Past/Calendar remain accessible after redirect `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:129-135`
- vNext now: vNext destination shows agenda/month/week/day view buttons instead `src/components/placements/learner-career-calendar.tsx:153-165`
- Fix: Preserve Schedule view switcher on legacy calendar URL.

## G2-19-005-009  [P2] GAP  facet F03  effort M
- Legacy: Old Schedule month uses 4-category event color legend `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:222-227`
- vNext now: vNext uses Assessment/Interview/Other filter chips `src/components/placements/learner-career-calendar.tsx:200-210`
- Fix: Restore legend while keeping filter chips secondary.

## G2-19-005-012  [P2] GAP  facet F04  effort S
- Legacy: Old calendar labels today/outside-month/blocked CSS classes `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:197-203`
- vNext now: vNext distinguishes today/outside-month but not blocked-day CSS class `src/components/placements/learner-career-calendar.tsx:231-255`
- Fix: Restore blocked-day day-cell background and tooltip.

## G2-19-005-014  [P2] GAP  facet F05  effort M
- Legacy: Old month is Sunday-first with variable 35/42 cells `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:180-203`
- vNext now: vNext Monday-first 42 month day cells `src/components/placements/learner-career-calendar.tsx:93-102` `src/components/placements/learner-career-calendar.tsx:223-230`
- Fix: Align Sunday-first 5/6-week layout for legacy route.

## G2-19-005-015  [P2] GAP  facet F05  effort S
- Legacy: Old Schedule tab selected `view=month` `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:65-68` `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:129-135`
- vNext now: vNext calendar has separate view state agenda/month/week/day `src/modules/placements/learner-career-calendar-url-model.ts:5-15` `src/components/placements/learner-career-calendar.tsx:153-163`
- Fix: Map old month view alias and selected Calendar tab.

## G2-19-005-016  [P2] GAP  facet F05  effort M
- Legacy: Old click any calendar event goes to whole day Drawer `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:206-215`
- vNext now: vNext day cell switches to day view, event article opens event Drawer `src/components/placements/learner-career-calendar.tsx:237-244` `src/components/placements/learner-career-calendar.tsx:343-356`
- Fix: Offer day-level Drawer interaction matching old click handling.

## G2-19-005-018  [P2] GAP  facet F06  effort M
- Legacy: Old day selection stored in `dayOpen` local state `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:65-66` `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:161-175`
- vNext now: vNext URL date/view state with selectedKey per event `src/components/placements/learner-career-calendar.tsx:74-85` `src/components/placements/learner-career-calendar.tsx:114-116`
- Fix: Preserve modal day selection while using URL state only for calendar navigation.

## G2-19-005-040  [P2] GAP  facet F13  effort S
- Legacy: Old calendar drawer empty day copy `Nothing on this day.` `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:161-171`
- vNext now: vNext filtered empty period says No events match these filters... `src/components/placements/learner-career-calendar.tsx:317-323`
- Fix: Distinguish empty selected day from empty selected period, use original day wording.

## G2-19-005-042  [P2] MISSING  facet F14  effort M
- Legacy: Old calendar day links to job page for closing un-applied applications `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:161-170`
- vNext now: vNext calendar event links only to application/round details `src/components/placements/learner-career-calendar.tsx:294-300` `src/components/placements/learner-career-calendar.tsx:343-351`
- Fix: Restore deadline job-detail links.

## G2-19-005-047  [P2] GAP  facet F16  effort M
- Legacy: Old loading Skeleton fits PlacementsTabsLayout, route immediately replaced `docs/legacy-source/frontend/src/pages/learn/my-placements/calendar.js:9` `docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:11-14`
- vNext now: vNext full Calendar toolbar/agenda at 375 and 768 `src/app/(authenticated)/learn/my-placements/calendar/page.tsx:21-24` `src/components/placements/learner-career-calendar.tsx:133-210`
- Fix: Match short transition and compact Schedule month responsive canvas.

## G2-19-005-048  [P2] GAP  facet F16  effort M
- Legacy: Old Schedule month grid can show 35 or 42 Sun-first cells on viewport `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:180-203`
- vNext now: vNext hides desktop grid below 768 in favor of mobile agenda `src/components/placements/learner-career-calendar.tsx:223-305`
- Fix: Choose owner-approved mobile visual parity and month cell behavior.

## G2-19-005-049  [P2] GAP  facet F16  effort S
- Legacy: Old Drawer fixed440 width `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:161`
- vNext now: vNext event Drawer is responsive generic width `src/components/placements/learner-career-calendar.tsx:356-385`
- Fix: Match legacy width and touch-screen full-width controls.

## G2-19-005-052  [P2] GAP  facet F17  effort S
- Legacy: Old Schedule segmented buttons `aria-pressed`, label Show `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:129-135`
- vNext now: vNext Calendar sub-view buttons have aria-pressed, label Calendar view `src/components/placements/learner-career-calendar.tsx:153-165`
- Fix: Restore outer Coming up/Past/Calendar accessible segmented buttons after redirect.

## G2-19-005-054  [P2] GAP  facet F18  effort S
- Legacy: Old Schedule calendar legend `No drives (exams)` `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:222-227`
- vNext now: vNext legend/filters have Other/Assessment/Interview but no blackout label `src/components/placements/learner-career-calendar.tsx:200-210`
- Fix: Use exact blackout legend text.

## G2-19-004-006  [P2] GAP  facet F02  effort L
- Legacy: Old calendar month panel and 440px day Drawer are siblings within same view `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:157-175`
- vNext now: vNext embeds entire career-calendar toolbar/grid + event Drawer `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:136-140` `src/components/placements/learner-career-calendar.tsx:133-212` `src/components/placements/learner-career-calendar.tsx:356-385`
- Fix: Match compact month widget and day-wise drawer, avoid duplicate major page headers.

## G2-19-004-011  [P2] GAP  facet F03  effort M
- Legacy: Old calendar shows legend four categories: rounds, Talks, application deadlines, exam blocked `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:222-227`
- vNext now: vNext shows filters ALL/Assessment/Interview/Other and category badges `src/components/placements/learner-career-calendar.tsx:35-42` `src/components/placements/learner-career-calendar.tsx:200-210`
- Fix: Add exact four-category legend/markers, sourced from calendar extras.

## G2-19-004-012  [P2] GAP  facet F03  effort M
- Legacy: Old date controls arrows and Today aligned around Month heading `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:186-194`
- vNext now: vNext prev/next/Today plus view controls/date input/Export .ics `src/components/placements/learner-career-calendar.tsx:153-199`
- Fix: For Schedule calendar view, reproduce compact month controls and navigation layout.

## G2-19-004-020  [P2] GAP  facet F05  effort M
- Legacy: Legacy selected tab uses query `view=month` and shallow router replace `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:65-68`
- vNext now: vNext calendar tab href `?view=calendar` and nested URL calendar view state `src/app/(authenticated)/learn/my-placements/schedule/page.tsx:108-111` `src/components/placements/learner-career-calendar.tsx:74-80`
- Fix: Map older link aliases and keep calendar month anchor stable when tabbing.

## G2-19-004-021  [P2] GAP  facet F05  effort M
- Legacy: Legacy month grid Sunday-first Sun..Sat, 35 days unless 6th row needed `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:180-203`
- vNext now: vNext Monday-first Mon..Sun and 42 days regardless of month `src/components/placements/learner-career-calendar.tsx:93-102` `src/components/placements/learner-career-calendar.tsx:223-230`
- Fix: Use Sunday-first 5/6 weeks on Schedule surface; preserve valid period navigation.

## G2-19-004-022  [P2] GAP  facet F05  effort M
- Legacy: Legacy month displays every event/deadline/blocked chip inside day cell `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:197-217`
- vNext now: vNext day cell shows bounded first chips + `+N more`, only round kinds `src/components/placements/learner-career-calendar.tsx:231-255`
- Fix: Show deadline/exam markers and full event chip access via day detail.

## G2-19-004-038  [P2] GAP  facet F09  effort M
- Legacy: Legacy direct calendar event click invokes `onDay(d)` `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:206-215`
- vNext now: vNext day-cell click changes view to day rather than open Drawer `src/components/placements/learner-career-calendar.tsx:237-243`
- Fix: Click day should open date Drawer on Schedule surface; preserve separate day-view action if desired.

## G2-19-004-056  [P2] GAP  facet F13  effort S
- Legacy: Legacy empty calendar day Drawer says `Nothing on this day.` `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:161-175`
- vNext now: vNext event Drawer opens for one item only; selected-day view uses other empty text `src/components/placements/learner-career-calendar.tsx:317-323` `src/components/placements/learner-career-calendar.tsx:356-385`
- Fix: Restore day Drawer empty content exact wording.

## G2-19-004-058  [P2] MISSING  facet F14  effort M
- Legacy: Legacy calendar linked un-applied application deadline to job detail page `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:161-170`
- vNext now: vNext round calendar links exact round/application only `src/components/placements/learner-career-calendar.tsx:294-300` `src/components/placements/learner-career-calendar.tsx:343-351`
- Fix: Link deadline to proper job detail using scoped identifier.

## G2-19-004-063  [P2] GAP  facet F16  effort M
- Legacy: Legacy calendar 7-day CSS grid 35/42 cells includes event chips `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:180-222`
- vNext now: vNext month grid hidden <768, substituted mobile agenda `src/components/placements/learner-career-calendar.tsx:223-305`
- Fix: Match legacy month mobile breakpoint or document redesigned mobile agenda decision.

## G2-19-004-064  [P2] GAP  facet F16  effort S
- Legacy: Legacy drawer width440 fixed `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:161`
- vNext now: vNext generic Drawer event detail lacks local width prop `src/components/placements/learner-career-calendar.tsx:356-385`
- Fix: Match width440 on desktop and full-width safe mobile.

## G2-19-004-077  [P2] GAP  facet F20  effort M
- Legacy: Legacy calendar blocked-date fetch invalidated on month/view switch `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:91-101`
- vNext now: vNext calendar filters rounds locally with navigation URL state `src/components/placements/learner-career-calendar.tsx:74-114`
- Fix: If blocked events loaded async, discard stale month responses on navigation.

## G2-19-004-085  [P2] GAP  facet F23  effort L
- Legacy: Legacy calendar shows four event categories and day detail; no .ics download `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:197-227`
- vNext now: vNext includes agenda/week/day and iCal export, but excludes blocked/deadline categories `src/components/placements/learner-career-calendar.tsx:35-42` `src/components/placements/learner-career-calendar.tsx:121-151`
- Fix: Keep additional views/export as extras while restoring legacy event kinds.

## G2-18-023-067  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/StudentCalendarService.java:40-94 talks via jobService.getCalendarJobIdsForLearner; exams via TpoInsightsService
- vNext now: src/components/placements/learner-career-calendar.tsx:85-89 round input only
- Fix: Wire TPO talk and exam integrations as read-only learner-filtered events.

## G2-19-005-055  [P3] GAP  facet F18  effort S
- Legacy: Old day Drawer empty `Nothing on this day.` `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:171`
- vNext now: vNext no matching date Drawer copy `src/components/placements/learner-career-calendar.tsx:356-385`
- Fix: Restore sentence in empty date panel.

## G2-19-005-058  [P3] GAP  facet F19  effort S
- Legacy: Old 35/42 day grid limits unused sixth week `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:180-184`
- vNext now: vNext always 42 days regardless `src/components/placements/learner-career-calendar.tsx:93-102`
- Fix: Match five-row months to reduce scroll height.

## G2-19-004-074  [P3] GAP  facet F19  effort S
- Legacy: Legacy month dynamically uses 35 or 42 day cells `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:180-184`
- vNext now: vNext uses 42 always, period events used with monthly filters `src/components/placements/learner-career-calendar.tsx:93-102`
- Fix: Avoid unused sixth week and extra vertical whitespace when it would not be shown.
