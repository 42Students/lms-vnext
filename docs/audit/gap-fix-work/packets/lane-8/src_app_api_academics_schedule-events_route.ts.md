# Work packet: edit src/app/api/academics/schedule-events/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/class-schedule-controller.md

## G2-2-032-046  [P3] GAP  facet F08  effort S
- Legacy: ClassScheduleController.java:154-155 create returns wrapped OK.
- vNext now: schedule-events/route.ts:48-54 returns `{event}` for POST.
- Fix: Align success banner/toast duration and response parser.
