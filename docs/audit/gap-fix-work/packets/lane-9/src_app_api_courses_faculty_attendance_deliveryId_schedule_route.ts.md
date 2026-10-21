# Work packet: edit src/app/api/courses/faculty/attendance/[deliveryId]/schedule/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u027-faculty-class-schedule-controller.md

## G2-16-027-017  [P3] GAP  facet F08  effort S
- Legacy: FacultyClassScheduleController.java:77-78 success message OK and ClassSchedule.
- vNext now: courses/faculty/attendance/[deliveryId]/schedule/route.ts:18 {result}.
- Fix: Preserve successful schedule details and confirmation.
