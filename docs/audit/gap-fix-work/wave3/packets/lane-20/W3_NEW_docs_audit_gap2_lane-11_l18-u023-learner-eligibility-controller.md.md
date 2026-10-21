# Work packet (wave 3): NEW / MISSING items from docs/audit/gap2/lane-11/l18-u023-learner-eligibility-controller.md

3 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-11/l18-u023-learner-eligibility-controller.md

## G2-18-023-011  [P1] MISSING  facet F04  effort L
- Legacy: Calendar extras returns talks and exam blocks for requested start/end; LearnerEligibilityController.java:140-155
- vNext now: vNext Career Calendar consumes placement request rounds only; calendar/page.tsx:10-38
- Fix: Merge scoped preplacement talks and exam blocks into calendar events with clear type legend.

## G2-18-023-026  [P1] MISSING  facet F10  effort L
- Legacy: Calendar extras delegates StudentCalendarService.extras(learner,start,end); LearnerEligibilityController.java:146-155
- vNext now: New calendar uses only request workspace rounds; calendar/page.tsx:12-37
- Fix: Add calendar extras service query, merge into visible calendar and invalidate after schedule edits.

## G2-18-023-047  [P1] MISSING  facet F23  effort L
- Legacy: Legacy self company preview and calendar extras are separate supported endpoints; LearnerEligibilityController.java:124-155
- vNext now: vNext inspected placement job detail/calendar do not supply those source-specific resources; calendar/page.tsx:10-38
- Fix: Treat these as feature gaps, not cosmetic; close only with permission-scoped source readers and UI.
