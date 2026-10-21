# Work packet (wave 2): edit src/app/(authenticated)/tpo/home/page.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/l19-u022-tpo-hub-controller.md, docs/audit/gap2/lane-2/l19-u022-tpo-hub-controller.md, docs/audit/gap2/lane-6/l11-u014-tpo-home.md

## G2-19-022-001  [P2] GAP  facet F01  effort M
- Legacy: GET `/api/v1/tpo/home` accepts `team=false`, optional `seasonId`; all groups sit under `/api/v1/tpo` (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoHubController.java:20,46-49).
- vNext now: Home is route `src/app/(authenticated)/tpo/home/page.tsx:31-45`; vNext invokes server reads without identical URL contract.
- Fix: Document/retain deep links `/tpo/home`, team and season selection when transitioning from old portal; map legacy `team` and `seasonId` to vNext UI/query.

## G2-19-022-039  [P2] GAP  facet F13  effort S
- Legacy: Home returns assembled `needsYou` and `team` without a separate per-widget failure state (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoHubController.java:47-66).
- vNext now: vNext suppresses multiple source exceptions as null with `optionalDataUnavailable` flag: `src/app/(authenticated)/tpo/home/page.tsx:50-73`.
- Fix: Ensure page displays a concrete partial-data notice and retry for each failed source; no silent zeroing of placement counts.

## G2-19-022-109  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/tpo/home.js:69-75 DashboardSkeleton and RefreshStatus
- vNext now: src/app/(authenticated)/tpo/home/page.tsx:32-45 server page gating, src/app/(authenticated)/tpo/home/page.tsx:175-179 warning but no client loader on this page
- Fix: Compare loading.tsx and refresh indicator to legacy fallback/reread UX

## G2-19-022-120  [P2] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/pages/tpo/home.js:69-75 retry and load UI
- vNext now: src/app/(authenticated)/tpo/home/page.tsx:175-179 partial notice no Retry button on inline notice
- Fix: Make partial failure retry actionable via keyboard; announce restored data

## G2-19-022-121  [P2] GAP  facet F18  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/home.js:18-19 owner goal least cognitive load, 7 quiet rows, not headline KPI dashboard
- vNext now: src/app/(authenticated)/tpo/home/page.tsx:180-198 adds 4 KPI tiles and changed hierarchy
- Fix: Restore original visual copy priority and uncluttered first-view surface

## G2-19-022-122  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/tpo/home.js:81-83 Home refresh failed. Showing the last successful snapshot.
- vNext now: src/app/(authenticated)/tpo/home/page.tsx:179 Some Home indicators could not be loaded...
- Fix: Use precise stale-vs-partial wording based on actual fallback behavior

## G2-11-014-051  [P2] GAP  facet F18  effort S
- Legacy: Legacy error/refresh copy Could not load Home; Home refresh failed. Showing the last successful snapshot.; Refreshing placement home… (home.js:32-39,75-85).
- vNext now: vNext retains refresh/error exact copy but core SSR fail has only partial info (tpo-home-return-refresh.tsx:59-66; tpo/home/page.tsx:175-180).
- Fix: Restore fatal initial error copy and Retry while retaining matched refresh strings.

## G2-11-014-057  [P2] GAP  facet F22  effort M
- Legacy: Legacy JSON numbers.liveDrives/registered/placedUnique, needsYou[] priorities, batches[] and thisWeek[] dates (homeRows.js:25-105).
- vNext now: vNext typed TpoHomeSummary built from independent persisted DB data; lacks explicit verified flag for pendingRequests in row model (tpo-home-legacy-rows.ts:3-13; tpo/home/page.tsx:117-144).
- Fix: Add nullable verified counts and identity fields, preserve zero vs unknown.
