# Work packet: edit src/modules/placements/learner-placement-rules-service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l18-u023-learner-eligibility-controller.md, docs/audit/gap2/lane-8/learner-placement-rules-moved.md, docs/audit/gap2/lane-9/l18-u023-learner-eligibility-controller.md

## G2-18-023-014  [P1] GAP  facet F05  effort M
- Legacy: Rule page uses student batch rules with overrides; PlacementRulesService.java:37-80; LearnerEligibilityController.java:110-120
- vNext now: vNext `placementCollegeRules` by collegeId only; learner-placement-rules-service.ts:34-47
- Fix: Resolve current learner's active placement batch policy override rather than only college base.

## G2-18-023-032  [P1] GAP  facet F12  effort L
- Legacy: Legacy batch override applies counts-as-placed and held offer params per learner; PlacementRulesService.java:37-80
- vNext now: VNext rules service reads college-only and held offer model; learner-placement-rules-service.ts:34-47
- Fix: Read effective batch policy for current enrollment and reuse in held-offer apply gate.

## G2-18-023-043  [P1] GAP  facet F20  effort M
- Legacy: Legacy rules calculation uses fixed precedence and `summarySentenceFor` student own batch; PlacementRulesService.java:57-80,142-153
- vNext now: VNext policy exists by college with no override in own read; learner-placement-rules-service.ts:34-47
- Fix: Define canonical effective-policy lookup with change timestamps and reconciliation test for batch overrides.

## G2-18-023-045  [P1] GAP  facet F22  effort L
- Legacy: Legacy eligibility has JSON job criteria, learner academic record, override, batch rules and student calendar events; EligibilityService.java:52-115; LearnerEligibilityController.java:102-155
- vNext now: vNext placementJobEligibilityPolicies, candidateEvidence, Overrides, placementCollegeRules, learnerRounds; eligibility-service.ts:978-1320; learner-placement-rules-service.ts:34-47
- Fix: Write column-by-column crosswalk including effective batch policy and student talk/exam block tables.

## G2-8-5-001  [P1] GAP  facet F01  effort M
- Legacy: Old bookmark automatically routes to /learn/my-placements/placement#rules (`docs/legacy-source/frontend/src/pages/learn/my-placements/rules.js:1-10; docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:9-15; docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-115`)
- vNext now: Same bookmark path now renders its own complete rules page (`src/app/(authenticated)/learn/my-placements/rules/page.tsx:8-136; src/modules/placements/learner-placement-rules-service.ts:24-70; src/app/(authenticated)/learn/my-placements/placement/page.tsx:89-92`)
- Fix: Provide legacy redirect compatibility or record intentional canonical-route break

## G2-8-5-037  [P1] MISSING  facet F23  effort M
- Legacy: Old route auto-redirected with three-row transition placeholder (`docs/legacy-source/frontend/src/pages/learn/my-placements/rules.js:1-10; docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:9-15; docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:18-115`)
- vNext now: Redirect behavior absent on replacement route (`src/app/(authenticated)/learn/my-placements/rules/page.tsx:8-136; src/modules/placements/learner-placement-rules-service.ts:24-70; src/app/(authenticated)/learn/my-placements/placement/page.tsx:89-92`)
- Fix: Resolve explicit compatibility policy before UI fixes; preserve old bookmarks

## G2-18-023-068  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementRulesService.java:40-80 JSON placement_batch.rules_json overlays college_placement_rules
- vNext now: src/modules/placements/learner-placement-rules-service.ts:38-47 only placementCollegeRules record
- Fix: Read persisted cohort/batch overrides and add effective rules projection.
