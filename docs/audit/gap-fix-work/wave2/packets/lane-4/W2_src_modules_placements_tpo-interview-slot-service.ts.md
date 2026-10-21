# Work packet (wave 2): edit src/modules/placements/tpo-interview-slot-service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u019-interview.md, docs/audit/gap2/lane-8/interview-controller.md

## G2-14-019-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy organization-scoped interview scheduling API /api/v1/interviews `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:17-21` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:41-48`
- vNext now: New interview work split into TPO job round/slot workspace and recruiter HR slots `src/modules/placements/tpo-interview-slot-service.ts:30-82` `src/modules/placements/hr-interview-slot-service.ts:56-84`
- Fix: Map all legacy interview routes to round and candidate slot views

## G2-14-019-017  [P2] GAP  facet F05  effort M
- Legacy: Legacy learner past includes cancelled history `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/InterviewRepository.java:69-80`
- vNext now: New TPO workspace excludes CANCELLED slots by default `src/modules/placements/tpo-interview-slot-service.ts:48-51`
- Fix: Expose authorized cancellation history in past tab

## G2-14-019-024  [P2] GAP  facet F06  effort M
- Legacy: Legacy rescheduleRequestJson contains reason note windows `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:114-123`
- vNext now: New learner requests ROUND_RESCHEDULE with status and reason `src/modules/placements/tpo-interview-slot-service.ts:60-73` `src/modules/placements/tpo-interview-slot-service.ts:252-316`
- Fix: Retain preferred windows and original note in request detail

## G2-14-019-047  [P2] GAP  facet F13  effort M
- Legacy: Legacy isDeleted soft delete retains cancelled history `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:17-21` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/InterviewRepository.java:69-80`
- vNext now: New status CANCELLED row retained in DB but hidden by active list filter `src/db/schema/placement-round-candidate-slots.ts:16-20` `src/modules/placements/tpo-interview-slot-service.ts:48-51`
- Fix: Provide past-cancelled access in learner history

## G2-14-019-052  [P2] GAP  facet F15  effort M
- Legacy: Legacy round description/venue interpolated into candidate mail `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:259-294`
- vNext now: New message body may include changed room and IST time `src/modules/placements/tpo-interview-slot-service.ts:241-242` `src/modules/placements/tpo-interview-slot-service.ts:315-317`
- Fix: Ensure candidate sees round context/meeting link in notifications

## G2-14-019-063  [P2] GAP  facet F20  effort M
- Legacy: Legacy previous scheduled time retained until reconfirm `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:125-135`
- vNext now: New cancelled old slot plus booked new, but no previous pair projection `src/modules/placements/tpo-interview-slot-service.ts:284-295`
- Fix: Show old/new comparison after reschedule until acknowledgement

## G2-8-027-004  [P2] GAP  facet F01  effort M
- Legacy: Legacy interview/{id}/confirm learner POST and request/cancel reschedule POST (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:731-738,842-849,1001-1009).
- vNext now: New learner confirmOwnPlacementRound and placementLearnerRequests round-reschedule workflow (src/modules/placements/learner-round-confirmation-service.ts:17-61; src/modules/placements/tpo-interview-slot-service.ts:60-81,249-317).
- Fix: Provide semantic path adaptation and clear confirmation/reschedule entry point.
