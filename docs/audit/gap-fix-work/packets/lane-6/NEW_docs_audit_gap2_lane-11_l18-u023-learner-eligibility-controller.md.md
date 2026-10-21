# Work packet: NEW / MISSING items from docs/audit/gap2/lane-11/l18-u023-learner-eligibility-controller.md

1 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-11/l18-u023-learner-eligibility-controller.md

## G2-18-023-019  [P2] GAP  facet F07  effort S
- Legacy: Calendar invalid range `start and end are required, and start must not be after end`; LearnerEligibilityController.java:146-153
- vNext now: Calendar uses date/view/kind params, not explicit range error; calendar/page.tsx:13-21
- Fix: Show range validation with exact diagnostic on event-fetch boundary.
