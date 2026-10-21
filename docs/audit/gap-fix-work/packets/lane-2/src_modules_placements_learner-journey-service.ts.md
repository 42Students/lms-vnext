# Work packet: edit src/modules/placements/learner-journey-service.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u023-learner-placement-controller.md

## G2-16-023-005  [P1] GAP  facet F02  effort L
- Legacy: LearnerJourneyService.java:153-157 applications/schedule/offers in one response.
- vNext now: learner-journey-service.ts:150-192 returns applications only.
- Fix: Supply typed schedule+offers in journey response or document separate equivalent endpoints.

## G2-16-023-010  [P1] GAP  facet F04  effort L
- Legacy: LearnerPlacementService.java:45 schedule assigned dates/rooms.
- vNext now: learner-journey-service.ts:42-124 loads applications/results/offers, no round bookings.
- Fix: Join round assignments and expose schedule sorted by start.

## G2-16-023-012  [P1] GAP  facet F04  effort M
- Legacy: LearnerJourneyService.java:30-38 application fields logo/jobType/pay/location/deadline/assessment/cancel reason.
- vNext now: learner-journey-service.ts:45-61 selects drive title/status/closedAt and company name, omits several fields.
- Fix: Preserve detail metadata in journey DTO or accessible link, incl cancelled reason.

## G2-16-023-015  [P1] GAP  facet F05  effort L
- Legacy: LearnerJourneyService.java:47-50 rounds ordered jobId,seq,id.
- vNext now: learner-journey-service.ts:109-124 results loaded but no raw round catalog.
- Fix: Render each round in sequence including unreached future stages.

## G2-16-023-033  [P1] GAP  facet F12  effort M
- Legacy: LearnerJourneyService.java:25-26 active statuses and released offer statuses.
- vNext now: learner-journey-service.ts:121-123 offers only ISSUED/ACCEPTED.
- Fix: Include DECLINED/EXPIRED/WITHDRAWN released history, never prerelease.

## G2-16-023-034  [P1] GAP  facet F12  effort L
- Legacy: LearnerJourneyService.java:99-114 state CLEARED,NOT_CLEARED,ABSENT,WAITLISTED,TALK,NEXT,LATER.
- vNext now: learner-journey-service.ts:176-191 screening and result list without state projection.
- Fix: Build exact per-round state reducer respecting blocked/ended/live.

## G2-16-023-035  [P1] GAP  facet F12  effort M
- Legacy: LearnerJourneyService.java:147-150 withdrawal SELF until booked, then REQUEST.
- vNext now: learner-journey-service.ts:162-191 no withdraw mode.
- Fix: Compute withdrawal policy from booked round/current status and expose UI action.

## G2-16-023-036  [P1] GAP  facet F12  effort L
- Legacy: LearnerJourneyService.java:129-140 expected schedule for upcoming unbooked next round; talk rounds visible.
- vNext now: learner-journey-service.ts:150-192 no schedule list.
- Fix: Include expected vs confirmed flag and room/slot fields.

## G2-16-023-024  [P2] GAP  facet F07  effort S
- Legacy: LearnerPlacementController.java:30 `Only students have placements` on journey/process.
- vNext now: learner-journey-service.ts:26-32 throws AuthorizationError placements.read.
- Fix: Map forbidden message safely while retaining 403.
