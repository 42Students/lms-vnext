# Work packet: NEW / MISSING items from docs/audit/gap2/lane-8/interview-controller.md

15 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-8/interview-controller.md

## G2-8-027-008  [P1] GAP  facet F03  effort M
- Legacy: Legacy status SCHEDULED,CONFIRMED,RESCHEDULE_REQUESTED,COMPLETED,CANCELLED,NO_SHOW (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:49-58).
- vNext now: New round slot status AVAILABLE/BOOKED/CANCELLED and separate learnerConfirmedAt (src/db/schema/placement-round-candidate-slots.ts:14-20).
- Fix: Define distinct booking/learner confirmation/reschedule/completion status projection.

## G2-8-027-010  [P1] GAP  facet F03  effort M
- Legacy: Legacy feedback rating, comments, recommend action and submittedBy fields (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:108-112,147-159).
- vNext now: New slot table only booking/confirmation fields; separate screening/review model elsewhere (src/db/schema/placement-round-candidate-slots.ts:7-22).
- Fix: Restore authorized interview feedback fields/read-only learner projection.

## G2-8-027-011  [P1] GAP  facet F04  effort M
- Legacy: Legacy interview ID INT, organizationId INT, Job,JobApplication,Learner FK (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:31-47).
- vNext now: New slot UUID jobId,roundId,applicationId; college via job, no learner FK (src/db/schema/placement-round-candidate-slots.ts:7-13).
- Fix: Backfill interview-to-slot IDs and enforce application membership link.

## G2-8-027-018  [P1] GAP  facet F06  effort M
- Legacy: Legacy POST creates Interview body @Valid, requires scheduledDate and linked job/application/learner (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:227-232; docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:33-58).
- vNext now: New SCHEDULE appointment action requires round/application and future timestamp (src/modules/placements/college-interview-action-service.ts:54-73).
- Fix: Map each legacy required field with explicit validation and contextual error.

## G2-8-027-020  [P1] GAP  facet F06  effort M
- Legacy: Legacy feedback JSON rating number, comments string, recommendAction enum; no other types accepted (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:912-978).
- vNext now: New slot action model supports SCHEDULE/EDIT/CANCEL/NO_SHOW/COMPLETE, feedback not in that writer (src/modules/placements/college-interview-action-service.ts:54-66,140-166).
- Fix: Restore rating1..5/comment/recommend controls under staff permission.

## G2-8-027-023  [P1] GAP  facet F07  effort M
- Legacy: Legacy scheduling status requires SHORTLISTED/ASSESSMENT/INTERVIEW/OFFERED/HIRED (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:97-99,197-201).
- vNext now: New bookings require application SUBMITTED + screening SHORTLISTED (src/modules/placements/tpo-interview-slot-service.ts:364-386).
- Fix: Reconcile eligible application states, especially assessment/rejected/offer and special cases.

## G2-8-027-032  [P1] GAP  facet F10  effort M
- Legacy: Legacy schedule enforces org/job match and advances interview lifecycle/notification through InterviewService (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:170-256).
- vNext now: New separate round booking uses placementJobRounds and placementRoundCandidateSlots, emits in-app notification (src/modules/placements/tpo-interview-slot-service.ts:364-402,85-104).
- Fix: Map job/application screening stage transitions and avoid duplicate notification on rebook.

## G2-8-027-036  [P1] GAP  facet F12  effort M
- Legacy: Legacy schedule supports five interviewType and per-learner cross-application overlap check using global buffer (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:50-99,233-242).
- vNext now: New room overlap and booking uniqueness scoped round/room/job in slots service (src/modules/placements/tpo-interview-slot-service.ts:132-142,326-386).
- Fix: Enforce candidate double-booking across jobs and colleges, not only same room/round.

## G2-8-027-043  [P1] GAP  facet F15  effort M
- Legacy: Legacy feedback includes rating and recommendAction hidden to learners (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:95-112,147-159).
- vNext now: New slot change notice generic Interview update, feedback not shown in slot service (src/modules/placements/college-interview-action-service.ts:178-185).
- Fix: Ensure interview feedback submission does not leak private feedback via notifications.

## G2-8-027-049  [P1] GAP  facet F20  effort M
- Legacy: Legacy schedule locks application and learner to prevent cross-job overlapping interviews (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:170-189,233-242).
- vNext now: New slot service locks round and slot, checks same-round duplicate, no demonstrated cross-job learner lock (src/modules/placements/tpo-interview-slot-service.ts:125-130,364-399).
- Fix: Add global learner schedule collision guard across job/round per tenant.

## G2-8-027-022  [P2] GAP  facet F07  effort M
- Legacy: Legacy schedule missing Job ID message Job ID is required to schedule interview (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:239-245).
- vNext now: New invalid job context throws PLACEMENT_JOB_NOT_FOUND/domain error (src/modules/placements/college-interview-action-service.ts:13-21).
- Fix: Show user-facing job ID/selection required message.

## G2-8-027-024  [P2] GAP  facet F07  effort M
- Legacy: Legacy update stale token error This interview was updated by someone else. Please refresh and try again. (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:672-675).
- vNext now: New college edit throws PLACEMENT_ROUND_STALE using expectedVersion (src/modules/placements/college-interview-action-service.ts:123-133).
- Fix: Translate stale version into exact human sentence and preserve version on form.

## G2-8-027-026  [P2] GAP  facet F08  effort M
- Legacy: Legacy schedule 201 Interview scheduled successfully (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:282-285).
- vNext now: New SCHEDULE action returns receipt and emits Interview scheduled for [job] at ISO timestamp. (src/modules/placements/college-interview-action-service.ts:114-121).
- Fix: Match confirmation wording/date display and HTTP contract.

## G2-8-027-027  [P2] GAP  facet F08  effort M
- Legacy: Legacy cancel Interview cancelled successfully; complete Interview marked as completed (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:708-711,821-825).
- vNext now: New action status receipt and notification text Interview update (src/modules/placements/college-interview-action-service.ts:154-186).
- Fix: Preserve action-specific toasts, especially completed versus cancelled.

## G2-8-027-028  [P2] GAP  facet F08  effort M
- Legacy: Legacy learner confirm Interview confirmed successfully and safe DTO (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:769-779).
- vNext now: New confirmOwnPlacementRound returns idempotent receipt (src/modules/placements/learner-round-confirmation-service.ts:17-61).
- Fix: Show old confirmation wording without disclosing internal notes.
