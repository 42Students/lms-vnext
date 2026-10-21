# Work packet (wave 2): edit src/modules/attendance/faculty-schedule-editor-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u027-faculty-class-schedule-controller.md

## G2-16-027-009  [P2] GAP  facet F06  effort M
- Legacy: ClassScheduleDTO.java:14-30 positive class/faculty, required start/end, optional hall/title.
- vNext now: faculty-schedule-editor-model.ts:7-22 requires two IST datetimes, implicit delivery member.
- Fix: Keep hidden owned assignment and optional hall select defaults.

## G2-16-027-034  [P3] GAP  facet F18  effort S
- Legacy: ClassScheduleServiceImpl.java:305-318 exact original schedule validation messages.
- vNext now: faculty-schedule-editor-model.ts:8-22 has Choose both a start and an end time; End time must be after start time; A class can be at most 12 hours.
- Fix: Preserve exact old validation copy if literal clone required.
