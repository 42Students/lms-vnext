# Work packet (wave 2): edit src/app/(authenticated)/learn/my-placements/placement/page.tsx

21 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/placement-cell.md, docs/audit/gap2/lane-16/u023-learner-placement-controller.md, docs/audit/gap2/lane-8/learner-placement-rules-moved.md

## G2-12-005-005  [P2] GAP  facet F02  effort S
- Legacy: Three `.sp-panel` bordered sections with `.sp-panel__head` `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:175-235`
- vNext now: Tailwind border-bottom sections, no matching panel framing `src/app/(authenticated)/learn/my-placements/placement/page.tsx:34-92`
- Fix: Match panel title bars/padding/borders

## G2-12-005-012  [P2] GAP  facet F04  effort S
- Legacy: One overview response must contain registration, offers, schedule, requests, debarments, notices `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:21-25`
- vNext now: Fetches registration/offers/alerts/request workspace independently `src/app/(authenticated)/learn/my-placements/placement/page.tsx:25-32`
- Fix: Preserve all six legacy data concepts/explicit missing sources

## G2-12-005-017  [P2] GAP  facet F05  effort S
- Legacy: One request history list for all types, source requestState labels `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:207-231`
- vNext now: Splits application/round/offer requests and general request history `src/app/(authenticated)/learn/my-placements/placement/page.tsx:76-87`
- Fix: Present unified chronological request history if parity required

## G2-12-005-040  [P2] GAP  facet F09  effort S
- Legacy: Absence/debarment quick buttons prefill request modal `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:108-116`
- vNext now: Supports request=absence-dispute URL and UUID prefill, not notice body/correction text `src/app/(authenticated)/learn/my-placements/placement/page.tsx:21-24,82-86`
- Fix: Preserve one-tap text prefill and notice context

## G2-12-005-041  [P2] GAP  facet F10  effort S
- Legacy: GET `/api/v1/learner/placement/overview`, POST `/placement/register`, POST `/requests` `docs/legacy-source/frontend/src/api/Services/TpoHubService.js:169-179`
- vNext now: Separate read service calls and Next API registration/general requests/specialized `src/app/(authenticated)/learn/my-placements/placement/page.tsx:25-32`
- Fix: Document changed endpoint and merged data contract

## G2-12-005-065  [P2] GAP  facet F17  effort S
- Legacy: Hash anchor scrollIntoView smooth after overview data loads `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:61-66`
- vNext now: Rules/requests id anchors exist but no post-load hash smooth-scroll hook `src/app/(authenticated)/learn/my-placements/placement/page.tsx:76-92`
- Fix: Restore deep-link anchor focus/scroll

## G2-12-005-073  [P2] GAP  facet F19  effort S
- Legacy: One overview GET with all required nested arrays and shape validity `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:44-58`
- vNext now: Four independent read services in Promise.all, some optional fallbacks `src/app/(authenticated)/learn/my-placements/placement/page.tsx:25-32`
- Fix: Document multi-query error/partial rendering and cap data volume

## G2-12-005-084  [P2] GAP  facet F22  effort S
- Legacy: Legacy overview debarments/notices and offers included in single shape `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:23-25`
- vNext now: New data divided across independent registration/offers/alert/request reads `src/app/(authenticated)/learn/my-placements/placement/page.tsx:25-32`
- Fix: Verify debarment status and absence notices preserved as structured records

## G2-16-023-002  [P2] GAP  facet F01  effort M
- Legacy: LearnerPlacementController.java:24-25 overview one endpoint.
- vNext now: placement/page.tsx:18-35 uses multiple independent server reads and page title Placement cell.
- Fix: Document overview field mapping and retain unified summary on learner landing.

## G2-16-023-004  [P2] GAP  facet F02  effort M
- Legacy: LearnerPlacementService.java:28-51 overview order registration, offers, schedule, requests, debarments, notices.
- vNext now: placement/page.tsx:35-92 registration, help, links, alerts, offers, requests, rules; schedule on separate route.
- Fix: Compare course-style section ordering and move/anchor all legacy sections.

## G2-16-023-008  [P2] GAP  facet F03  effort M
- Legacy: LearnerPlacementService.java:49-50 notices returned last 40.
- vNext now: placement/page.tsx:44-55 links notices/alerts; notices on Announcements route.
- Fix: Preserve recent notice summary on equivalent overview with count.

## G2-16-023-042  [P2] GAP  facet F15  effort M
- Legacy: LearnerPlacementService.java:134-151 UTC notice times converted IST, links to schedule/offers/jobs.
- vNext now: placement/page.tsx:44-55 only navigation shortcuts.
- Fix: Keep deep links and India time in rendered cards.

## G2-16-023-052  [P2] GAP  facet F21  effort L
- Legacy: LearnerPlacementService.java:23-27 BatchRegistration,Scheduler,Requests,Notices and TPO season dependencies.
- vNext now: placement/page.tsx:10-15 offer/alert/request/registration services.
- Fix: Keep independent schedule/debarment and notification providers connected.

## G2-8-5-002  [P2] GAP  facet F01  effort S
- Legacy: router.replace replaces history after router.isReady (`docs/legacy-source/frontend/src/pages/learn/my-placements/rules.js:1-10; docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:9-15; docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-115`)
- vNext now: No router.replace; page remains at current path (`src/app/(authenticated)/learn/my-placements/rules/page.tsx:8-136; src/modules/placements/learner-placement-rules-service.ts:24-70; src/app/(authenticated)/learn/my-placements/placement/page.tsx:89-92`)
- Fix: Preserve replace semantics for old links

## G2-8-5-012  [P2] GAP  facet F06  effort S
- Legacy: Original redirect is automatic, without cancel or submit (`docs/legacy-source/frontend/src/pages/learn/my-placements/rules.js:1-10; docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:9-15; docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-115`)
- vNext now: New page requires interaction to navigate to original target (`src/app/(authenticated)/learn/my-placements/rules/page.tsx:8-136; src/modules/placements/learner-placement-rules-service.ts:24-70; src/app/(authenticated)/learn/my-placements/placement/page.tsx:89-92`)
- Fix: Provide automatic alias redirect or explicitly preserve old destination link

## G2-8-5-021  [P2] GAP  facet F12  effort S
- Legacy: Always redirects to fixed destination even if no data exists (`docs/legacy-source/frontend/src/pages/learn/my-placements/rules.js:1-10; docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:9-15; docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-115`)
- vNext now: New page content depends on persisted records (`src/app/(authenticated)/learn/my-placements/rules/page.tsx:8-136; src/modules/placements/learner-placement-rules-service.ts:24-70; src/app/(authenticated)/learn/my-placements/placement/page.tsx:89-92`)
- Fix: Redirect before data reads for compatibility alias

## G2-8-5-023  [P2] GAP  facet F13  effort S
- Legacy: Ant Design Skeleton active with paragraph rows=3 (`docs/legacy-source/frontend/src/pages/learn/my-placements/rules.js:1-10; docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:9-15; docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-115`)
- vNext now: No redirect skeleton in new page function (`src/app/(authenticated)/learn/my-placements/rules/page.tsx:8-136; src/modules/placements/learner-placement-rules-service.ts:24-70; src/app/(authenticated)/learn/my-placements/placement/page.tsx:89-92`)
- Fix: Restore transitional skeleton for client redirect or switch to server redirect

## G2-8-5-027  [P2] GAP  facet F16  effort M
- Legacy: Skeleton within PageShell supports responsive tab swipe (`docs/legacy-source/frontend/src/pages/learn/my-placements/rules.js:1-10; docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:9-15; docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-115`)
- vNext now: Replacement page uses responsive spacing and links but not old placeholder (`src/app/(authenticated)/learn/my-placements/rules/page.tsx:8-136; src/modules/placements/learner-placement-rules-service.ts:24-70; src/app/(authenticated)/learn/my-placements/placement/page.tsx:89-92`)
- Fix: Compare at 375/768/1280, including skeleton and tab interactions

## G2-8-5-031  [P2] GAP  facet F19  effort M
- Legacy: Initial wrapper issues no domain DB read before replacing route (`docs/legacy-source/frontend/src/pages/learn/my-placements/rules.js:1-10; docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:9-15; docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-115`)
- vNext now: Replacement blocks on multiple server reads (`src/app/(authenticated)/learn/my-placements/rules/page.tsx:8-136; src/modules/placements/learner-placement-rules-service.ts:24-70; src/app/(authenticated)/learn/my-placements/placement/page.tsx:89-92`)
- Fix: Measure new read latency and consider lightweight legacy server redirect

## G2-8-5-032  [P2] GAP  facet F20  effort S
- Legacy: Target URL literal; old query is discarded (`docs/legacy-source/frontend/src/pages/learn/my-placements/rules.js:1-10; docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:9-15; docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-115`)
- vNext now: New page parses optional query state, does not force target (`src/app/(authenticated)/learn/my-placements/rules/page.tsx:8-136; src/modules/placements/learner-placement-rules-service.ts:24-70; src/app/(authenticated)/learn/my-placements/placement/page.tsx:89-92`)
- Fix: Preserve bookmarked hash and canonical route mapping

## G2-8-5-033  [P2] GAP  facet F20  effort S
- Legacy: router.replace prevents backward loop to old bookmark (`docs/legacy-source/frontend/src/pages/learn/my-placements/rules.js:1-10; docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:9-15; docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-115`)
- vNext now: New page remains in history, separate navigation only (`src/app/(authenticated)/learn/my-placements/rules/page.tsx:8-136; src/modules/placements/learner-placement-rules-service.ts:24-70; src/app/(authenticated)/learn/my-placements/placement/page.tsx:89-92`)
- Fix: Verify back button and redirect-loop prevention
