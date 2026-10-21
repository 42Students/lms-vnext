# Work packet: edit src/modules/attendance/admin-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u001-college-admin-attendance.md, docs/audit/gap2/lane-5/u009-attendance-shared-component.md, docs/audit/gap2/lane-8/attend.md

## G2-5-001-036  [P1] GAP  facet F11 Permissions/tenant scope  effort M
- Legacy: Legacy superadmin GLOBAL mode may choose college and org-scoped may access college in org; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAttendanceController.java:75-91
- vNext now: vNext SA requires context.adminScope.collegeId equals requested college; src/modules/attendance/admin-service.ts:68-76
- Fix: Confirm scoped Super Admin selector transition; allow sanctioned global/org scope college selection if required by legacy.

## G2-5-001-065  [P1] GAP  facet F22 Data model/migrations  effort L
- Legacy: Legacy ClassSchedule embeds courseId/facultyId/attendanceMarkedAt; docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ClassSchedule.java:15-35
- vNext now: vNext schedule event + separate attendance_sessions + course delivery join; src/db/schema/attendance.ts:63-108; src/modules/attendance/admin-service.ts:298-359
- Fix: Audit cross-term/class-course mapping so no legacy session or faculty assignment is lost when attached to delivery.

## G2-5-009-040  [P1] GAP  facet F10 Actions/side effects  effort M
- Legacy: Read per-student attendance record before correction (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:52-71; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAttendanceController.java:206-259)
- vNext now: Uses loaded records from month snapshot (src/components/attendance/admin-attendance-workspace.tsx:207-218; src/modules/attendance/admin-service.ts:374-415)
- Fix: Add scoped current-record endpoint and compare-and-set.

## G2-8-021-023  [P2] GAP  facet F07  effort M
- Legacy: Legacy class schedule unknown message: Class schedule not found (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerServiceImpl.java:520-527).
- vNext now: New missing/invalid event throws SCHEDULE_EVENT_NOT_FOUND or CONTENT_DELIVERY_MISMATCH (src/modules/attendance/faculty-service.ts:522-531; src/modules/attendance/admin-service.ts:494-505).
- Fix: Translate domain codes to legacy-grade actionable field/page error copy.
