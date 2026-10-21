# Work packet: edit drizzle/0033_attendance_foundation.sql

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u009-teacher-attendance-view.md

## G2-14-009-082  [P1] GAP  facet F22  effort M
- Legacy: No correction policy DB table in legacy report `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:143-173`
- vNext now: New policy check is 1–8760 in TS schema but 1–168 in 0033 migration `src/db/schema/attendance.ts:17-60` `drizzle/0033_attendance_foundation.sql:1-10`
- Fix: Reconcile DDL and schema upper bound
