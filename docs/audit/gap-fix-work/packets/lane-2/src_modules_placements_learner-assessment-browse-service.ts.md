# Work packet: edit src/modules/placements/learner-assessment-browse-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/learner-placement-assessments-moved.md

## G2-8-6-001  [P1] GAP  facet F01  effort M
- Legacy: Old bookmark automatically routes to /learn/my-placements/schedule (`docs/legacy-source/frontend/src/pages/learn/my-placements/assessments.js:1-10; docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:9-15; docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-115`)
- vNext now: Same bookmark path now renders its own complete assessments page (`src/app/(authenticated)/learn/my-placements/assessments/page.tsx:12-79; src/modules/placements/learner-assessment-browse-service.ts:8-17; src/app/(authenticated)/learn/my-placements/schedule/page.tsx:104-115`)
- Fix: Provide legacy redirect compatibility or record intentional canonical-route break

## G2-8-6-037  [P1] MISSING  facet F23  effort M
- Legacy: Old route auto-redirected with three-row transition placeholder (`docs/legacy-source/frontend/src/pages/learn/my-placements/assessments.js:1-10; docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:9-15; docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-115`)
- vNext now: Redirect behavior absent on replacement route (`src/app/(authenticated)/learn/my-placements/assessments/page.tsx:12-79; src/modules/placements/learner-assessment-browse-service.ts:8-17; src/app/(authenticated)/learn/my-placements/schedule/page.tsx:104-115`)
- Fix: Resolve explicit compatibility policy before UI fixes; preserve old bookmarks
