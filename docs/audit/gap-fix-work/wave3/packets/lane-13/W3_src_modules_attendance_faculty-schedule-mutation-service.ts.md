# Work packet (wave 3): edit src/modules/attendance/faculty-schedule-mutation-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u027-faculty-class-schedule-controller.md

## G2-16-027-005  [P1] MISSING  facet F04  effort L
- Legacy: ClassScheduleDTO.java:29 lectureHallId is separate integer FK.
- vNext now: faculty-schedule-mutation-service.ts:83-88 uses free-text location only.
- Fix: Persist hall FK and capacity/overlap logic.

## G2-16-027-021  [P1] MISSING  facet F10  effort L
- Legacy: ClassScheduleServiceImpl.java:373-380 persists lecture hall FK.
- vNext now: faculty-schedule-mutation-service.ts:83-98 location text only.
- Fix: Store hall booking and enforce conflict atomically.

## G2-16-027-043  [P1] MISSING  facet F23  effort L
- Legacy: ClassScheduleServiceImpl.java:335-370 lecture hall conflict required.
- vNext now: faculty-schedule-mutation-service.ts:68-80 missing hall check.
- Fix: Treat shared lecture hall overbooking as a blocking gap.
