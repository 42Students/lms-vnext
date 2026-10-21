# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-16/u023-learner-placement-controller.md

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-16/u023-learner-placement-controller.md

## G2-16-023-051  [P2] GAP  facet F20  effort M
- Legacy: LearnerJourneyService.java:152 sorts schedule by string startsAt.
- vNext now: journey service.ts:150-192 no schedule; time values elsewhere.
- Fix: Sort UTC instants stable and format IST, include past records.
