# Work packet (wave 2): edit src/app/api/placements/journey/me/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u023-learner-placement-controller.md

## G2-16-023-003  [P2] GAP  facet F01  effort M
- Legacy: LearnerPlacementController.java:35-43 journey+drive process endpoints.
- vNext now: journey/me/route.ts:8-19 one journey GET and drive view separately.
- Fix: Link drive process directly from learner drive page, preserve visible/public round details.

## G2-16-023-028  [P2] GAP  facet F10  effort M
- Legacy: LearnerPlacementController.java:24-50 GET overview/journey/process, POST register.
- vNext now: journey/me/route.ts:8-19 and registration/route.ts:11-28 split endpoints.
- Fix: Maintain endpoint method semantics and document response adapter.

## G2-16-023-038  [P2] GAP  facet F13  effort S
- Legacy: LearnerJourneyService.java:39 empty apps returns three empty arrays.
- vNext now: journey/me/route.ts:15 returns `{journey:[]}`.
- Fix: Provide typed empty schedule/offers or preserve consumer-safe empty.
