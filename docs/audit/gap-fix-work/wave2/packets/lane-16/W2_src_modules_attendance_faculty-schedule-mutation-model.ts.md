# Work packet (wave 2): edit src/modules/attendance/faculty-schedule-mutation-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u027-faculty-class-schedule-controller.md

## G2-16-027-044  [P2] GAP  facet F06  effort M
- Legacy: ClassScheduleDTO.java:13-31 optional freeform title and no description/location payload fields.
- vNext now: faculty-schedule-mutation-model.ts:3-8 requires title 3-160 characters, requires nullable description up to 1000 and location up to 240.
- Fix: For parity, allow absent/blank title and explicitly document optional enhanced description/location; retain length limits only if signed off.
