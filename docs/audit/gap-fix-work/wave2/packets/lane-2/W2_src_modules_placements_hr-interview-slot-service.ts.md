# Work packet (wave 2): edit src/modules/placements/hr-interview-slot-service.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u019-interview.md, docs/audit/gap2/lane-2/l14-u025-recruiter-drive.md

## G2-14-019-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy organization-scoped interview scheduling API /api/v1/interviews `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:17-21` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:41-48`
- vNext now: New interview work split into TPO job round/slot workspace and recruiter HR slots `src/modules/placements/tpo-interview-slot-service.ts:30-82` `src/modules/placements/hr-interview-slot-service.ts:56-84`
- Fix: Map all legacy interview routes to round and candidate slot views

## G2-14-019-018  [P2] GAP  facet F05  effort M
- Legacy: Legacy org/college lists pageable and unpaged variants `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/InterviewRepository.java:29-55`
- vNext now: New recruiter slots list capped 100 `src/modules/placements/hr-interview-slot-service.ts:56-79`
- Fix: Add cursor paging for large interview history

## G2-14-019-019  [P2] GAP  facet F06  effort S
- Legacy: Legacy interview date mandatory, future UTC `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:55-58` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:300-303`
- vNext now: New slot start must future, HR max180 days ahead `src/modules/placements/hr-interview-slot-service.ts:97-99`
- Fix: Document 180-day new constraint and exact validation copy

## G2-14-019-059  [P2] GAP  facet F19  effort M
- Legacy: Legacy SQL interview queries indexed by app/learner/org and pageable `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/InterviewRepository.java:29-94`
- vNext now: New slots indexed round/date and one-active booking, recruiter cap100 `src/db/schema/placement-round-candidate-slots.ts:25-29` `src/modules/placements/hr-interview-slot-service.ts:69-73`
- Fix: Index candidate upcoming by membership and paginate historic joins

## G2-14-025-019  [P2] GAP  facet F06  effort M
- Legacy: RecruiterDriveController.java:45 SlotsRequest.slots array
- vNext now: src/modules/placements/hr-interview-slot-service.ts:84-90 action single slot
- Fix: Preserve batch slot editor if legacy required.

## G2-14-025-041  [P2] GAP  facet F12  effort M
- Legacy: RecruiterDriveController.java:173-175 slots bulk proposal
- vNext now: src/modules/placements/hr-interview-slot-service.ts:84-90 single action
- Fix: Define atomic batch/partial success and retry.

## G2-14-025-056  [P2] GAP  facet F20  effort M
- Legacy: RecruiterDriveController.java:173-175 batch slots
- vNext now: src/modules/placements/hr-interview-slot-service.ts:136-145 slot CAS/version/capacity
- Fix: Avoid partial duplicate booking on retries.

## G2-14-025-064  [P2] GAP  facet F23  effort M
- Legacy: RecruiterDriveController.java:173-175 accepts slots array
- vNext now: src/modules/placements/hr-interview-slot-service.ts:84-90 one slot per action
- Fix: Document dropped batch proposal or restore.
