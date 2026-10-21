# Work packet (wave 2): edit src/app/api/courses/faculty/attendance/[deliveryId]/schedule/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u027-faculty-class-schedule-controller.md

## G2-16-027-001  [P2] GAP  facet F01  effort M
- Legacy: FacultyClassScheduleController.java:22-30 POST /api/v1/faculty/schedules.
- vNext now: courses/faculty/attendance/[deliveryId]/schedule/route.ts:10-18 POST on delivery UUID.
- Fix: Map old course/class IDs to delivery scope and route.

## G2-16-027-006  [P2] GAP  facet F04  effort S
- Legacy: FacultyClassScheduleController.java:77-78 returns Response(status OK, data ClassSchedule).
- vNext now: courses/faculty/attendance/[deliveryId]/schedule/route.ts:16-18 returns result(id,status,updatedAt).
- Fix: Adapt response summary and refresh schedule list.
