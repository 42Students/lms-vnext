# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-11/l18-u023-learner-eligibility-controller.md

3 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-11/l18-u023-learner-eligibility-controller.md

## G2-18-023-016  [P2] GAP  facet F06  effort M
- Legacy: calendar-extras requires start and end ISO.DATE_TIME and order; LearnerEligibilityController.java:146-154
- vNext now: vNext Calendar URL accepts date/view/kind and local anchor rather than explicit start/end; calendar/page.tsx:10-21
- Fix: Enforce bounded requested range, parse ISO offsets as IST-safe and hide blocks outside visible window.

## G2-18-023-034  [P2] GAP  facet F13  effort S
- Legacy: Legacy calendar extras no events returns an empty talks/blocks collection; StudentCalendarService.extras closure
- vNext now: VNext calendar has empty rounds states, but not talks/blocked exam day categories; calendar/page.tsx:21-37
- Fix: Differentiate no events vs extras unavailable; show reliable empty state per category.

## G2-18-023-040  [P2] GAP  facet F18  effort M
- Legacy: Legacy points authored using batch-effective policy and personal sentence; LearnerEligibilityController.java:102-121; PlacementRulesService.java:149-179,196-233
- vNext now: New learner-college-placement-rules-model returns different six points and personal text; model.ts:7-35
- Fix: Compare exact legacy copy and numeric rounding, use sentence source from effective rule version.
