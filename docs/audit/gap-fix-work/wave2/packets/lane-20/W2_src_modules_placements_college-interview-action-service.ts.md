# Work packet (wave 2): edit src/modules/placements/college-interview-action-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/interview-controller.md

## G2-8-027-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy Interview entity captures one appointment, feedback and learner response on single record (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:31-58,95-173).
- vNext now: New slot/round/candidate exceptions, college interviews and activity events split across screens (src/db/schema/placement-round-candidate-slots.ts:7-22; src/modules/placements/college-interview-action-service.ts:22-52,114-188).
- Fix: Document one interview page composition and exact section order across appointment and feedback.

## G2-8-027-009  [P2] GAP  facet F03  effort M
- Legacy: Legacy interviewerName comma-separated panel string up to255 (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:160-171).
- vNext now: New slots have panel text plus room, new college appointment interviewer string (src/db/schema/placement-round-candidate-slots.ts:14-16; src/modules/placements/college-interview-action-service.ts:89-105).
- Fix: Preserve exact panel/interviewer attribution, not collapse into room.

## G2-8-027-042  [P2] GAP  facet F15  effort M
- Legacy: Legacy interview schedule, confirm, cancel and reschedule notifications via NotificationDispatcherService and afterCommit hook (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:116-163).
- vNext now: New TPO/college writes inAppNotifications in transaction for time changes (src/modules/placements/tpo-interview-slot-service.ts:85-104; src/modules/placements/college-interview-action-service.ts:178-185).
- Fix: Check email/SMS channel parity and after-commit delivery versus durable in-app.
