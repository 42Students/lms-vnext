# Work packet: edit src/modules/placements/college-interview-lifecycle-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/interview-controller.md

## G2-8-027-038  [P1] GAP  facet F12  effort M
- Legacy: Legacy interview default status SCHEDULED and can confirm, request reschedule, complete, cancel, no-show (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:49-58).
- vNext now: New slot BOOKED, learnerConfirmedAt separate, current status; outcome in activity event (src/db/schema/placement-round-candidate-slots.ts:14-21; src/modules/placements/college-interview-lifecycle-service.ts:15-27).
- Fix: Preserve all legacy transitions including cancellation of reschedule request.
