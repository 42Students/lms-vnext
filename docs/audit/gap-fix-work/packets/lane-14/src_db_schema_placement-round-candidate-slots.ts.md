# Work packet: edit src/db/schema/placement-round-candidate-slots.ts

16 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l12-u030-interview-form.md, docs/audit/gap2/lane-14/u019-interview.md, docs/audit/gap2/lane-8/interview-controller.md

## G2-12-030-052  [P1] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:49-88,166-167 — Interview entity captures type/mode/location/notes/round desc/creator/255 interviewer/version
- vNext now: src/db/schema/placement-round-candidate-slots.ts:1-80 — candidate slot schema with roundId, startsAt, endsAt, room, panel, status
- Fix: Create explicit old Interview-to-slot migration/data parity matrix, including lost fields.

## G2-14-019-002  [P1] GAP  facet F01  effort L
- Legacy: Legacy interview belongs directly to Job JobApplication Learner `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:33-47`
- vNext now: New round belongs job; candidate slot optionally links application `src/db/schema/placements.ts:1222-1231` `src/db/schema/placement-round-candidate-slots.ts:7-12`
- Fix: Define canonical interview entity projection joining slot round application and learner

## G2-14-019-003  [P1] GAP  facet F02  effort L
- Legacy: Legacy one Interview row houses scheduling status feedback and reschedule `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:49-171`
- vNext now: New normalized round, candidate slot, HR slot and requests `src/db/schema/placements.ts:1222-1351` `src/db/schema/placement-round-candidate-slots.ts:7-35`
- Fix: Build complete join-backed detail for interview workbench

## G2-14-019-004  [P1] GAP  facet F02  effort M
- Legacy: Legacy interview directly organization scoped `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:33-35`
- vNext now: New job/slot college and company relationship tenant scoped `src/db/schema/placement-round-candidate-slots.ts:7-11` `src/modules/placements/hr-interview-slot-service.ts:17-53`
- Fix: Support SA org-scope only through explicit authorized college context

## G2-14-019-008  [P1] GAP  facet F04  effort L
- Legacy: Legacy Interview has organizationId,jobId,applicationId,learnerId integer FKs `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:33-47`
- vNext now: New slot references UUID job,round,application; learner via application membership `src/db/schema/placement-round-candidate-slots.ts:7-12` `src/db/schema/placements.ts:973-1018`
- Fix: Map all four legacy IDs and verify college crosslinks

## G2-14-019-010  [P1] GAP  facet F04  effort L
- Legacy: Legacy interviewStatus SCHEDULED CONFIRMED RESCHEDULE_REQUESTED COMPLETED CANCELLED NO_SHOW `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:52-53`
- vNext now: New round PENDING SCHEDULED COMPLETED CANCELLED, slot AVAILABLE BOOKED CANCELLED `src/db/schema/placements.ts:1250-1258` `src/db/schema/placement-round-candidate-slots.ts:16-17`
- Fix: Map all six statuses including NO_SHOW and reschedule requested

## G2-14-019-016  [P1] GAP  facet F05  effort M
- Legacy: Legacy learner upcoming filters three active statuses `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/InterviewRepository.java:90-94`
- vNext now: New booking status and requests need join to pending reschedule `src/db/schema/placement-round-candidate-slots.ts:16-20` `src/modules/placements/tpo-interview-slot-service.ts:60-73`
- Fix: Match upcoming vs past tabs including pending reschedules

## G2-14-019-035  [P1] GAP  facet F10  effort M
- Legacy: Legacy enforces one live round per application `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:332-339`
- vNext now: New candidate can book one slot per round via partial unique index `src/db/schema/placement-round-candidate-slots.ts:25-27`
- Fix: Block simultaneous rounds across multiple round IDs for same application

## G2-14-019-041  [P1] GAP  facet F11  effort M
- Legacy: Legacy no-show feedback admin only `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:95-113`
- vNext now: New round/slot model has no NO_SHOW status `src/db/schema/placement-round-candidate-slots.ts:29-35` `src/db/schema/placements.ts:1301-1304`
- Fix: Add no-show outcome without exposing raw admin feedback

## G2-14-019-060  [P1] GAP  facet F19  effort L
- Legacy: Legacy duration-aware overlap reads active interviews under locks `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/InterviewRepository.java:104-129`
- vNext now: New room-level slot overlaps and active uniqueness `src/db/schema/placement-round-candidate-slots.ts:25-35` `src/modules/placements/tpo-interview-slot-service.ts:136-139`
- Fix: Add cross-round candidate overlap exclusion robust under concurrent writes

## G2-14-019-065  [P1] GAP  facet F22  effort L
- Legacy: Legacy interview table int PK and 4 FK, interviewType/status, UTC scheduledDate, feedback/reschedule JSON `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:17-171`
- vNext now: New separate placementJobRounds and placementRoundCandidateSlots UUID FKs/timestamps `src/db/schema/placements.ts:1222-1351` `src/db/schema/placement-round-candidate-slots.ts:7-35`
- Fix: Create full legacy-to-new field migration crosswalk with stable interview ID alias

## G2-14-019-066  [P1] GAP  facet F22  effort L
- Legacy: Legacy reschedule history prev date/changedAt and feedback provenance `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:125-158`
- vNext now: New slot confirmedAt/changedBy, round results and request history `src/db/schema/placement-round-candidate-slots.ts:18-24` `src/db/schema/placements.ts:1354-1493`
- Fix: Preserve history/attribution and private feedback data

## G2-14-019-067  [P1] GAP  facet F22  effort L
- Legacy: Legacy uniqueness overlap enforced by service instead of scheduled hour index `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:60-67` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:306-328`
- vNext now: New room time unique only within round, no cross-round candidate uniqueness `src/db/schema/placement-round-candidate-slots.ts:25-35`
- Fix: Add effective exclusion logic for learner and panel collisions

## G2-8-027-003  [P1] GAP  facet F01  effort M
- Legacy: Legacy GET /application/{id} and /learner/{id}/organization/{orgId} (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:396-399,475-482).
- vNext now: New round confirmation and learner placement pages use booked round slots, not legacy interview collection (src/modules/placements/learner-round-confirmation-service.ts:19-61; src/db/schema/placement-round-candidate-slots.ts:7-22).
- Fix: Expose application/learner interview list with old links redirected to new round rows.

## G2-8-027-007  [P1] GAP  facet F03  effort M
- Legacy: Legacy type SCREENING,TECHNICAL,HR,MANAGERIAL,FINAL (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:53-56).
- vNext now: New rounds kind INTERVIEW/GD and separate round names, no literal five-step interviewType in slot schema (src/modules/placements/college-interview-action-service.ts:25-30; src/db/schema/placement-round-candidate-slots.ts:7-22).
- Fix: Preserve interview type metadata and display labels when migrating old rounds.

## G2-8-027-014  [P1] GAP  facet F04  effort M
- Legacy: Legacy durationMinutes optional, default60, configured min15 max480 (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:78-82; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:58-60,82-92).
- vNext now: New slot explicit endsAt minus startsAt, generated day plan and configurable interval in model (src/modules/placements/tpo-interview-slot-service.ts:132-142; src/db/schema/placement-round-candidate-slots.ts:7-22).
- Fix: Carry legacy duration and bound checks into slot generation/editing.
