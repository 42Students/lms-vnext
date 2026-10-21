# Work packet: edit src/modules/people/college-faculty-schedule-reassignment-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/class-schedule-controller.md

## G2-2-032-048  [P2] GAP  facet F08  effort S
- Legacy: ClassScheduleController.java:208-210 reassign success `Reassigned N of M upcoming session(s)`.
- vNext now: college-faculty-schedule-reassignment-service.ts:130 returns total/reassigned/skipped/results.
- Fix: Render numeric summary with per-session warnings and follow-up links.
