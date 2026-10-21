# Work packet (wave 2): edit src/modules/attendance/admin-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/class-schedule-controller.md, docs/audit/gap2/lane-5/u001-college-admin-attendance.md, docs/audit/gap2/lane-5/u006-superadmin-attendance.md, docs/audit/gap2/lane-8/attend.md

## G2-2-032-010  [P2] GAP  facet F01  effort L
- Legacy: ClassScheduleController.java:394-469 attendance date-range and filtered absence report.
- vNext now: src/modules/attendance/admin-service.ts attendance report services separated from schedule event list.
- Fix: Map attendance report filters and response shape; preserve privacy checks.

## G2-2-032-024  [P2] GAP  facet F04  effort L
- Legacy: ClassScheduleController.java:439-469 filtered response `FilteredClassScheduleResponse` class schedules and absentee rows.
- vNext now: src/modules/attendance/admin-service.ts uses separate session/roster typed objects.
- Fix: Build complete joined report DTO with schedule ID, date, attendee/absentee rows.

## G2-5-001-031  [P2] GAP  facet F10 Actions and side effects  effort L
- Legacy: Read pipeline GET /api/v1/admin/attendance/monthly?collegeId,classId,courseId,startDate,endDate; docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:423-427; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAttendanceController.java:136-153
- vNext now: Server calls getAdminAttendanceGrid by collegeId/deliveryId/month using Drizzle joins; src/app/(authenticated)/college/attendance/page.tsx:71-76; src/modules/attendance/admin-service.ts:282-425
- Fix: Verify parity of class-wide sessions when multiple course deliveries/periods share a class/course; explicitly document term scoping.

## G2-5-006-034  [P2] GAP  facet F10 Actions/side effects  effort L
- Legacy: Monthly GET scoped by college,class,course,from/to (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:414-444; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAttendanceController.java:136-153)
- vNext now: Server getAdminAttendanceGrid scoped by deliveryId/month (src/app/(authenticated)/admin/attendance/page.tsx:68-92; src/modules/attendance/admin-service.ts:282-425)
- Fix: Preserve selected class/course periods when multiple delivery rows exist.

## G2-8-021-062  [P2] GAP  facet F21  effort M
- Legacy: Legacy absence and correction directly invoke asynchronous SMS service configured via GLOBAL app settings (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerServiceImpl.java:608-628,661-674).
- vNext now: New admin queues guardian SMS and dispatcher attempt after transaction (src/modules/attendance/parent-sms-service.ts:84-109; src/modules/attendance/admin-service.ts:634-651).
- Fix: Document provider credentials, DLT template, consent gating, retry/failure observability.
