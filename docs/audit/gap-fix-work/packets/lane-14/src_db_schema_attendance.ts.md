# Work packet: edit src/db/schema/attendance.ts

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l18-u020-class-schedule.md, docs/audit/gap2/lane-14/u009-teacher-attendance-view.md, docs/audit/gap2/lane-15/take-attendance.md, docs/audit/gap2/lane-18/course-attendance-report.md, docs/audit/gap2/lane-5/u001-college-admin-attendance.md, docs/audit/gap2/lane-5/u006-superadmin-attendance.md

## G2-18-020-011  [P1] GAP  facet F04  effort M
- Legacy: ClassSchedule.java:32-35 nullable attendanceMarkedAt single event marker
- vNext now: src/db/schema/attendance.ts:63-108 attendanceSessions(scheduleEventId, status, markedByUserId, markedAt,updatedAt)
- Fix: Keep exact null=unmarked semantics; migrate read projections through attendance_sessions with status source of truth

## G2-18-020-016  [P1] GAP  facet F05  effort M
- Legacy: ClassScheduleRepository.java:17-18 all scheduled count vs :31-43 held count for denominator
- vNext now: src/db/schema/academics.ts:467-476 schedules dates/status; attendanceSessions at src/db/schema/attendance.ts:63-108
- Fix: Use startsAt<=now and SCHEDULED/held policy for denominator, never include future or cancelled; per-course count too

## G2-18-020-028  [P1] GAP  facet F10  effort M
- Legacy: ClassSchedule.java:32-35 writes attendance timestamp when bulk mark succeeds
- vNext now: src/db/schema/attendance.ts:63-108 stores marker separate keyed schedule_event_id
- Fix: Audit transaction across attendance_sessions and attendance_records; no false MARKED when bulk write fails

## G2-14-009-079  [P1] GAP  facet F22  effort L
- Legacy: Old class_schedule integer IDs and string timestamps plus marked_at `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ClassSchedule.java:10-35`
- vNext now: New UUID schedule/delivery and timestamptz attendance session `src/modules/attendance/faculty-service.ts:253-300` `src/db/schema/attendance.ts:63-107`
- Fix: Document migration map for class/course/faculty/session

## G2-14-009-080  [P1] GAP  facet F22  effort M
- Legacy: Legacy attend unique student_id plus class_schedule_id, has reason and marked_by `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Attend.java:10-42`
- vNext now: New attendance_records UUID compound unique and note/markedBy columns `src/db/schema/attendance.ts:110-169`
- Fix: Map legacy reason/status/provenance fully

## G2-14-009-082  [P1] GAP  facet F22  effort M
- Legacy: No correction policy DB table in legacy report `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:143-173`
- vNext now: New policy check is 1–8760 in TS schema but 1–168 in 0033 migration `src/db/schema/attendance.ts:17-60` `drizzle/0033_attendance_foundation.sql:1-10`
- Fix: Reconcile DDL and schema upper bound

## G2-15-009-086  [P1] GAP  facet F22  effort L
- Legacy: attend unique student/schedule, absence reason (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Attend.java:11-26`)
- vNext now: Unique event/membership, status/notes/actor/time fields (`src/db/schema/attendance.ts:110-168`)
- Fix: Map statuses/notes, absence reasons, historical identities

## G2-15-009-087  [P1] GAP  facet F22  effort L
- Legacy: V156 nullable class_schedule.attendance_marked_at (`docs/legacy-source/backend/src/main/resources/db/migration/V156__class_schedule_attendance_marked.sql:1-8`)
- vNext now: attendance_sessions explicit lifecycle constraints (`src/db/schema/attendance.ts:63-107`)
- Fix: Backfill sentinel preserving all-present vs never-marked distinction

## G2-15-009-089  [P1] GAP  facet F22  effort M
- Legacy: Nullable marked_by and attendance_status (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Attend.java:33-42`)
- vNext now: Mandatory markedByUserId and markedAt on current rows (`src/db/schema/attendance.ts:124-144`)
- Fix: Specify unknown historical marker migration policy

## G2-18-009-066  [P1] GAP  facet F12  effort M
- Legacy: Legacy faculty Mark always shows Ready to mark, regardless session start (`TakeAttendance.js:293-307`).
- vNext now: New disallows NOT_STARTED and after correctionWindowHours, defaults24 (`faculty-attendance-workspace.tsx:271-278,855-861`; `attendance.ts:30-34`).
- Fix: Document intentional policy change; show reason disabled instead of silently denying.

## G2-18-009-097  [P1] GAP  facet F22  effort L
- Legacy: Legacy classScheduleId integer, absence list per student & attendanceMarked marker (`TeacherAttendanceView.jsx:143-170,327-354`; `TakeAttendance.js:100-151`).
- vNext now: New sectionScheduleEvents UUID, attendance_sessions MARKED/UNMARKED and attendance_records unique(event, membership) (`attendance.ts:63-169`).
- Fix: Document migration of original schedule IDs/absences and exact unmarked lifecycle.

## G2-5-001-065  [P1] GAP  facet F22 Data model/migrations  effort L
- Legacy: Legacy ClassSchedule embeds courseId/facultyId/attendanceMarkedAt; docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ClassSchedule.java:15-35
- vNext now: vNext schedule event + separate attendance_sessions + course delivery join; src/db/schema/attendance.ts:63-108; src/modules/attendance/admin-service.ts:298-359
- Fix: Audit cross-term/class-course mapping so no legacy session or faculty assignment is lost when attached to delivery.

## G2-5-006-069  [P1] GAP  facet F22 Data/migrations  effort L
- Legacy: Legacy ClassSchedule and Attend by classId/courseId/student (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:414-444; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAttendanceController.java:136-153)
- vNext now: sectionScheduleEvents and attendance_records keyed delivery/membership UUID (src/modules/attendance/admin-service.ts:282-425; src/db/schema/attendance.ts:63-169)
- Fix: Map historical attendance/absence rows, all deliveries and class periods.
