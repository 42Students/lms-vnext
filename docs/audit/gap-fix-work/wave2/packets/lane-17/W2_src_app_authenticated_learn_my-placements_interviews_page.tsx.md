# Work packet (wave 2): edit src/app/(authenticated)/learn/my-placements/interviews/page.tsx

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/learner-placements-interviews.md

## G2-17-005-002  [P2] GAP  facet F01  effort 
- Legacy: docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:11-14 uses router.replace for moved URL (history entry replaced).
- vNext now: src/app/(authenticated)/learn/my-placements/interviews/page.tsx:11-60 never redirects; stays at /interviews.
- Fix: Align navigation/history behavior and avoid stale browser back loop.

## G2-17-005-003  [P2] GAP  facet F01  effort 
- Legacy: docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-25 treats schedule as placement tab #4, /interviews falls back to Home #1 until redirect completes.
- vNext now: src/app/(authenticated)/learn/my-placements/interviews/page.tsx:34-36 creates stand-alone Interviews title; no Schedule nav indication in this route.
- Fix: Select correct Schedule tab during alias/redirect and match placement shell.

## G2-17-005-004  [P2] GAP  facet F02  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/my-placements/interviews.js:5-9 wraps redirect skeleton inside shared PlacementsTabsLayout page shell.
- vNext now: src/app/(authenticated)/learn/my-placements/interviews/page.tsx:34-60 own PageHeader and rounds workspace without explicit PlacementsTabsLayout tab strip.
- Fix: Keep legacy My Placements shell, top title/nav tabs and Schedule active label.

## G2-17-005-005  [P2] GAP  facet F02  effort 
- Legacy: docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:95-110 PageShell title 'My Placements', tabs and swipe-direction transition content.
- vNext now: src/app/(authenticated)/learn/my-placements/interviews/page.tsx:34-60 header 'Interviews' with no swipe-content wrapper.
- Fix: Match content canvas margins, PageShell grouping and swipe navigation.

## G2-17-005-007  [P2] GAP  facet F03  effort 
- Legacy: docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:71-86 announcements count badge in placements tabs.
- vNext now: src/app/(authenticated)/learn/my-placements/interviews/page.tsx:34-60 has no placement tab/announcement indicator locally.
- Fix: Restore shared tab count and active Schedule state.

## G2-17-005-009  [P2] GAP  facet F04  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/my-placements/interviews.js:5-7 has no data fetch or formatting before redirect.
- vNext now: src/app/(authenticated)/learn/my-placements/interviews/page.tsx:19-22 always reads entire learner placement request workspace and withdrawal targets before query validation.
- Fix: Avoid redundant heavy read on redirect alias; validate query shape first where safe.

## G2-17-005-019  [P2] MISSING  facet F09  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:157-159 Calendar MonthView day drawer on selecting date.
- vNext now: src/app/(authenticated)/learn/my-placements/interviews/page.tsx:37-58 renders kind INTERVIEW workspace but no month-calendar view on entry.
- Fix: Use consolidated Schedule Calendar destination for original month/day drawer.

## G2-17-005-020  [P2] GAP  facet F10  effort 
- Legacy: docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:12 router.replace('/learn/my-placements/schedule') is only action, no direct API or mutation.
- vNext now: src/app/(authenticated)/learn/my-placements/interviews/page.tsx:21-22 performs two DB-backed scoped workspace reads on initial page.
- Fix: Restore lightweight server redirect for legacy entry; move reads to canonical Schedule.

## G2-17-005-028  [P2] GAP  facet F13  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:117-119 no learner returns null, data failed warning and 8-row loaded skeleton.
- vNext now: src/app/(authenticated)/learn/my-placements/interviews/page.tsx:19-22 awaits data then src/app/(authenticated)/learn/my-placements/interviews/error.tsx:12-22 separate error boundary.
- Fix: Distinguish auth failure, data failure and loading states with Schedule-equivalent labels.

## G2-17-005-031  [P2] GAP  facet F15  effort 
- Legacy: docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:71-80 layout reads unread announcements, updates badge on event 'placement-announcements-read'.
- vNext now: src/app/(authenticated)/learn/my-placements/interviews/page.tsx:34-60 omits local tabs/badge, so no per-page announcement count.
- Fix: Use shared placements navigation with unread badge.

## G2-17-005-033  [P2] GAP  facet F16  effort 
- Legacy: docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:95-110 shared responsive PageShell and swipe gesture content, :64-67 useSwipeNav.
- vNext now: src/app/(authenticated)/learn/my-placements/interviews/page.tsx:34-60 stand-alone responsive space-y-5, no swipe integration.
- Fix: Restore shared placement tab responsive layout and gestures.

## G2-17-005-035  [P2] GAP  facet F17  effort 
- Legacy: docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:96-101 PageShell tabsAriaLabel='Placements sections' with link navigation.
- vNext now: src/app/(authenticated)/learn/my-placements/interviews/page.tsx:34-60 renders no equivalent tab labels within page.
- Fix: Reinstate accessible shared placements tabs and active Schedule.

## G2-17-005-036  [P2] GAP  facet F18  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/my-placements/interviews.js:4 comment 'Moved into Schedule', docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:6-7 says bookmarks/emails still point here so redirects.
- vNext now: src/app/(authenticated)/learn/my-placements/interviews/page.tsx:35-36 title 'Interviews', description 'Your scheduled placement interview rounds and joining details.'.
- Fix: Restore My Placements/Schedule copy; record Interviews heading as new feature only if intentional.

## G2-17-005-037  [P2] GAP  facet F18  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:128 says 'Your tests, talks and interviews. When the placement cell books you, it shows here and you get a notice...'.
- vNext now: src/app/(authenticated)/learn/my-placements/interviews/page.tsx:36 narrows to 'Your scheduled placement interview rounds and joining details.'.
- Fix: Keep inclusive Schedule intro on old entrypoint.

## G2-17-005-039  [P2] GAP  facet F20  effort 
- Legacy: docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:11-14 client replace after router.isReady, no cancellation ref; effect repeats if to/router identity changes.
- vNext now: src/app/(authenticated)/learn/my-placements/interviews/page.tsx:24-31 validates query after expensive reads, then creates key link.key or all-interviews.
- Fix: Validate syntactic query before heavy scoped workspace reads while preserving side-channel safety.
