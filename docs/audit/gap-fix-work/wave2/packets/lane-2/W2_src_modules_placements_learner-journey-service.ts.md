# Work packet (wave 2): edit src/modules/placements/learner-journey-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u023-learner-placement-controller.md

## G2-16-023-013  [P2] GAP  facet F04  effort M
- Legacy: LearnerJourneyService.java:71-78 offers includes CTC/joining/released/letter/response times.
- vNext now: learner-journey-service.ts:110-123 offers status only in journey; separate offers service.
- Fix: Ensure journey cards link full offer details without leaking prerelease.

## G2-16-023-016  [P2] GAP  facet F05  effort M
- Legacy: LearnerJourneyService.java:152 schedule sorted startsAt ascending.
- vNext now: learner-journey-service.ts:150-192 no schedule array.
- Fix: Deliver chronological confirmed/expected events via schedule endpoint.

## G2-16-023-045  [P2] GAP  facet F18  effort S
- Legacy: LearnerPlacementService.java:68-72 learner-friendly status `in the test stage`,`placed`,`not selected`.
- vNext now: learner-journey-service.ts:176-185 exposes enum screening status.
- Fix: Map every displayed status to learner phrases; no raw enums.

## G2-16-023-050  [P2] GAP  facet F20  effort S
- Legacy: LearnerJourneyService.java:61-63 slot room fallback ignores literal string `null`.
- vNext now: learner-journey-service.ts:150-192 not exposing room.
- Fix: Normalize missing/null rooms and time zone in schedule DTO.

## G2-16-023-053  [P2] GAP  facet F22  effort L
- Legacy: LearnerPlacementService.java:38-48 SQL job_offer, round assignments, placement_debarment and notification_outbox.
- vNext now: learner-journey-service.ts:8-16 uses placementApplications/Screenings/jobs/Offers normalized tables.
- Fix: Map all response fields and stage/outbox models to live Postgres schema.
