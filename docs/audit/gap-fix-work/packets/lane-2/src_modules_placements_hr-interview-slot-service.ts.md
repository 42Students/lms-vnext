# Work packet: edit src/modules/placements/hr-interview-slot-service.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u019-interview.md, docs/audit/gap2/lane-2/l14-u025-recruiter-drive.md

## G2-14-019-004  [P1] GAP  facet F02  effort M
- Legacy: Legacy interview directly organization scoped `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:33-35`
- vNext now: New job/slot college and company relationship tenant scoped `src/db/schema/placement-round-candidate-slots.ts:7-11` `src/modules/placements/hr-interview-slot-service.ts:17-53`
- Fix: Support SA org-scope only through explicit authorized college context

## G2-14-019-034  [P1] GAP  facet F10  effort L
- Legacy: Legacy validates no candidate overlap across applications `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:306-310` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/InterviewRepository.java:104-129`
- vNext now: New HR slots check round overlap, TPO checks room overlap `src/modules/placements/hr-interview-slot-service.ts:107-111` `src/modules/placements/tpo-interview-slot-service.ts:136-139`
- Fix: Enforce learner cross-drive overlap under lock before booking

## G2-14-019-043  [P1] GAP  facet F12  effort L
- Legacy: Legacy duration-aware overlaps between candidate, application, interviewer `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:306-328`
- vNext now: New room and recruiter slot overlap checks `src/modules/placements/tpo-interview-slot-service.ts:136-139` `src/modules/placements/hr-interview-slot-service.ts:107-111`
- Fix: Enforce all three scopes with real interval checks

## G2-14-019-061  [P1] GAP  facet F20  effort L
- Legacy: Legacy application and learner locks serialize concurrent scheduling `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:185-256` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/InterviewRepository.java:111-129`
- vNext now: New locks round/slot, optimistic version for slot mutation `src/modules/placements/tpo-interview-slot-service.ts:125-130` `src/modules/placements/hr-interview-slot-service.ts:124-145`
- Fix: Define lock order round/app/learner to eliminate cross-drive conflict

## G2-14-019-064  [P1] GAP  facet F21  effort L
- Legacy: Legacy interview notification dispatcher, event publisher, scheduler reminders `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:117-166`
- vNext now: New TPO and recruiter services notify via activity/in-app pipeline `src/modules/placements/tpo-interview-slot-service.ts:85-104` `src/modules/placements/hr-interview-slot-service.ts:151-162`
- Fix: Map scheduled reminders/third-party email templates

## G2-14-025-034  [P1] GAP  facet F10  effort L
- Legacy: RecruiterDriveController.java:173-180 batch slots and selection submit
- vNext now: src/modules/placements/hr-interview-slot-service.ts:84-165 slot transitions
- Fix: Verify TPO handoff/selection recording and per-row results.

## G2-14-025-061  [P1] GAP  facet F22  effort L
- Legacy: RecruiterDriveController.java:163-180 results,slot,selection tables
- vNext now: src/modules/placements/hr-interview-slot-service.ts:56-165 versioned hrInterviewSlots
- Fix: Map old round results and selections to new statuses/history.

## G2-14-019-027  [P2] GAP  facet F07  effort M
- Legacy: Legacy overlap error names candidate/application/interviewer distinct `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:306-328`
- vNext now: New room-overlap and slot-overlap checks have generic SLOT_OVERLAP/room error `src/modules/placements/hr-interview-slot-service.ts:107-111` `src/modules/placements/tpo-interview-slot-service.ts:136-139`
- Fix: Surface exact conflict target and suggested time alternative

## G2-14-019-030  [P2] GAP  facet F08  effort S
- Legacy: Legacy feedback/change returns updated entity with version for client `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:87-93` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:41-48`
- vNext now: New HR slot write returns id/status, optimistic version in read projection `src/modules/placements/hr-interview-slot-service.ts:124-162`
- Fix: Return read-refresh token and explicit confirmation after write
