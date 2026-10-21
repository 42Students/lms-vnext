# Work packet: edit src/modules/placements/tpo-interview-slot-service.ts

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u019-interview.md, docs/audit/gap2/lane-8/interview-controller.md

## G2-14-019-016  [P1] GAP  facet F05  effort M
- Legacy: Legacy learner upcoming filters three active statuses `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/InterviewRepository.java:90-94`
- vNext now: New booking status and requests need join to pending reschedule `src/db/schema/placement-round-candidate-slots.ts:16-20` `src/modules/placements/tpo-interview-slot-service.ts:60-73`
- Fix: Match upcoming vs past tabs including pending reschedules

## G2-14-019-031  [P1] GAP  facet F08  effort L
- Legacy: Legacy interview notifications are sent after commit `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:146-167`
- vNext now: New TPO notice inserts in-app event in mutation transaction `src/modules/placements/tpo-interview-slot-service.ts:85-104`
- Fix: Preserve after-commit email/SMS expectations with outbox

## G2-14-019-033  [P1] GAP  facet F10  effort L
- Legacy: Legacy schedule creates new Interview, serializes application and learner locks `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:171-256`
- vNext now: New books candidate into existing round/slot, row-level lock CAS `src/modules/placements/tpo-interview-slot-service.ts:125-139` `src/modules/placements/tpo-interview-slot-service.ts:279-295`
- Fix: Map legacy direct interview create to slot booking without duplicate records

## G2-14-019-034  [P1] GAP  facet F10  effort L
- Legacy: Legacy validates no candidate overlap across applications `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:306-310` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/InterviewRepository.java:104-129`
- vNext now: New HR slots check round overlap, TPO checks room overlap `src/modules/placements/hr-interview-slot-service.ts:107-111` `src/modules/placements/tpo-interview-slot-service.ts:136-139`
- Fix: Enforce learner cross-drive overlap under lock before booking

## G2-14-019-040  [P1] GAP  facet F11  effort L
- Legacy: Legacy college admins may manage interview scoped by job college, shared org fallback `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/InterviewRepository.java:38-55`
- vNext now: New TPO service requires managed college, no default shared-org fallback `src/modules/placements/tpo-interview-slot-service.ts:17-29`
- Fix: Support approved shared-org history via acting-college gate

## G2-14-019-043  [P1] GAP  facet F12  effort L
- Legacy: Legacy duration-aware overlaps between candidate, application, interviewer `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:306-328`
- vNext now: New room and recruiter slot overlap checks `src/modules/placements/tpo-interview-slot-service.ts:136-139` `src/modules/placements/hr-interview-slot-service.ts:107-111`
- Fix: Enforce all three scopes with real interval checks

## G2-14-019-051  [P1] GAP  facet F15  effort L
- Legacy: Legacy JobNotificationHelper and event publisher after commit `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:117-166`
- vNext now: New TPO slot mutation records learner in-app notifications `src/modules/placements/tpo-interview-slot-service.ts:85-104`
- Fix: Map legacy email/SMS recipients/timing to outbox delivery

## G2-14-019-060  [P1] GAP  facet F19  effort L
- Legacy: Legacy duration-aware overlap reads active interviews under locks `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/InterviewRepository.java:104-129`
- vNext now: New room-level slot overlaps and active uniqueness `src/db/schema/placement-round-candidate-slots.ts:25-35` `src/modules/placements/tpo-interview-slot-service.ts:136-139`
- Fix: Add cross-round candidate overlap exclusion robust under concurrent writes

## G2-14-019-061  [P1] GAP  facet F20  effort L
- Legacy: Legacy application and learner locks serialize concurrent scheduling `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:185-256` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/InterviewRepository.java:111-129`
- vNext now: New locks round/slot, optimistic version for slot mutation `src/modules/placements/tpo-interview-slot-service.ts:125-130` `src/modules/placements/hr-interview-slot-service.ts:124-145`
- Fix: Define lock order round/app/learner to eliminate cross-drive conflict

## G2-14-019-064  [P1] GAP  facet F21  effort L
- Legacy: Legacy interview notification dispatcher, event publisher, scheduler reminders `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:117-166`
- vNext now: New TPO and recruiter services notify via activity/in-app pipeline `src/modules/placements/tpo-interview-slot-service.ts:85-104` `src/modules/placements/hr-interview-slot-service.ts:151-162`
- Fix: Map scheduled reminders/third-party email templates

## G2-8-027-001  [P1] GAP  facet F01  effort M
- Legacy: Legacy all interview operations under /api/v1/interviews, GET list and POST create (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:44-48,227-230,333-340).
- vNext now: New interview scheduling spread across college appointments and TPO job/round slot services (src/modules/placements/college-interview-action-service.ts:22-56; src/modules/placements/tpo-interview-slot-service.ts:30-105).
- Fix: Map old interview IDs/endpoints to canonical job+round+slot endpoints.

## G2-8-027-030  [P1] GAP  facet F10  effort M
- Legacy: Legacy POST schedule, PUT update, POST cancel, POST complete, POST feedback and learner POST confirm/reschedule/cancel (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:227-291,635-676,686-721,731-793,799-835,842-906,912-991,1001-1050).
- vNext now: New college SCHEDULE/EDIT/CANCEL/COMPLETE in writer, TPO round slots and learner acknowledgment separate (src/modules/placements/college-interview-action-service.ts:54-188; src/modules/placements/tpo-interview-slot-service.ts:105-470; src/modules/placements/learner-round-confirmation-service.ts:19-61).
- Fix: Publish operation-by-operation endpoint adapter with status, audit, notice and retry behavior.

## G2-8-027-054  [P1] GAP  facet F22  effort M
- Legacy: Legacy feedback stored per interview and reschedule_request_json, previous date/changed date (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:108-159).
- vNext now: New slot table no feedback, only learnerConfirmedAt; request stored separately (src/db/schema/placement-round-candidate-slots.ts:14-22; src/modules/placements/tpo-interview-slot-service.ts:60-73).
- Fix: Preserve history and evidence; add equivalent feedback/previous-slot fields or link to immutable audit.

## G2-14-019-027  [P2] GAP  facet F07  effort M
- Legacy: Legacy overlap error names candidate/application/interviewer distinct `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:306-328`
- vNext now: New room-overlap and slot-overlap checks have generic SLOT_OVERLAP/room error `src/modules/placements/hr-interview-slot-service.ts:107-111` `src/modules/placements/tpo-interview-slot-service.ts:136-139`
- Fix: Surface exact conflict target and suggested time alternative

## G2-14-019-028  [P2] GAP  facet F07  effort S
- Legacy: Legacy invalid status scheduling lists allowed statuses and current `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:197-201`
- vNext now: New requires job PUBLISHED, round kind INTERVIEW and SCHEDULED `src/modules/placements/tpo-interview-slot-service.ts:123-124`
- Fix: Show allowed actions/status in rejection copy
