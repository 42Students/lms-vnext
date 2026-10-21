# Work packet: edit src/modules/placements/learner-round-confirmation-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/interview-controller.md

## G2-8-027-030  [P1] GAP  facet F10  effort M
- Legacy: Legacy POST schedule, PUT update, POST cancel, POST complete, POST feedback and learner POST confirm/reschedule/cancel (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:227-291,635-676,686-721,731-793,799-835,842-906,912-991,1001-1050).
- vNext now: New college SCHEDULE/EDIT/CANCEL/COMPLETE in writer, TPO round slots and learner acknowledgment separate (src/modules/placements/college-interview-action-service.ts:54-188; src/modules/placements/tpo-interview-slot-service.ts:105-470; src/modules/placements/learner-round-confirmation-service.ts:19-61).
- Fix: Publish operation-by-operation endpoint adapter with status, audit, notice and retry behavior.

## G2-8-027-057  [P1] GAP  facet F23  effort M
- Legacy: Legacy confirms learner interview via standalone interview lifecycle statuses (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:731-793).
- vNext now: New learnerConfirmedAt on booked slot; status separate from booking (src/db/schema/placement-round-candidate-slots.ts:14-22; src/modules/placements/learner-round-confirmation-service.ts:17-61).
- Fix: Define explicit lifecycle mapping for old confirmed and reschedule requested states.
