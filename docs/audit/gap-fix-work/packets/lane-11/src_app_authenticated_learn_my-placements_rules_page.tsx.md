# Work packet: edit src/app/(authenticated)/learn/my-placements/rules/page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l18-u023-learner-eligibility-controller.md, docs/audit/gap2/lane-8/learner-placement-rules-moved.md, docs/audit/gap2/lane-9/l18-u023-learner-eligibility-controller.md

## G2-18-023-001  [P1] GAP  facet F01  effort M
- Legacy: GET `/api/v1/learner/drives/{jobId}/eligibility`, `/apply-check`, bulk `/apply-checks`, `/placement-rules`, `/{jobId}/company-preview`, `/calendar-extras`; LearnerEligibilityController.java:59-155
- vNext now: vNext server read paths for job detail, rules page, and calendar, no one-to-one legacy six-endpoint REST surface in inspected mapped modules; learner-job-service.ts:41-292; learn/my-placements/rules/page.tsx:8-136; calendar/page.tsx:10-38
- Fix: Write endpoint-to-server-action/route contract matrix, including preview/extras absences and authorized fallback.

## G2-8-5-001  [P1] GAP  facet F01  effort M
- Legacy: Old bookmark automatically routes to /learn/my-placements/placement#rules (`docs/legacy-source/frontend/src/pages/learn/my-placements/rules.js:1-10; docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:9-15; docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-115`)
- vNext now: Same bookmark path now renders its own complete rules page (`src/app/(authenticated)/learn/my-placements/rules/page.tsx:8-136; src/modules/placements/learner-placement-rules-service.ts:24-70; src/app/(authenticated)/learn/my-placements/placement/page.tsx:89-92`)
- Fix: Provide legacy redirect compatibility or record intentional canonical-route break

## G2-8-5-037  [P1] MISSING  facet F23  effort M
- Legacy: Old route auto-redirected with three-row transition placeholder (`docs/legacy-source/frontend/src/pages/learn/my-placements/rules.js:1-10; docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:9-15; docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-115`)
- vNext now: Redirect behavior absent on replacement route (`src/app/(authenticated)/learn/my-placements/rules/page.tsx:8-136; src/modules/placements/learner-placement-rules-service.ts:24-70; src/app/(authenticated)/learn/my-placements/placement/page.tsx:89-92`)
- Fix: Resolve explicit compatibility policy before UI fixes; preserve old bookmarks

## G2-18-023-072  [P1] MISSING  facet F23  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementRulesService.java:57-80 learner gets batch overrides and personal note
- vNext now: src/app/(authenticated)/learn/my-placements/rules/page.tsx:28-39 text says College-wide placement policy and only college rule values
- Fix: Show applicable cohort override badge and exact effective rule numbers.
