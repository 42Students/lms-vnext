# Work packet (wave 2): edit src/app/(authenticated)/learn/my-placements/assessments/page.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/learner-placement-assessments-moved.md

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
