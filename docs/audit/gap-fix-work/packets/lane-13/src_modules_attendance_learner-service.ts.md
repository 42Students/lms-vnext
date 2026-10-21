# Work packet: edit src/modules/attendance/learner-service.ts

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/course-attendance.md, docs/audit/gap2/lane-18/course-attendance-report.md, docs/audit/gap2/lane-19/learner-attendance.md, docs/audit/gap2/lane-2/class-schedule-controller.md, docs/audit/gap2/lane-5/u027-learner-controller.md

## G2-13-009-019  [P1] GAP  facet F04  effort L
- Legacy: Legacy student status per session from learnerSessionStatus (includes not held/not marked) (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/StudentAttendanceView.jsx:154-173`)
- vNext now: New status based on scheduled session + attendanceSession/record joins (`src/modules/attendance/learner-service.ts:135-258`)
- Fix: Crosswalk future/held/marked/unmarked/late statuses to legacy label and color.

## G2-13-009-076  [P1] GAP  facet F22  effort L
- Legacy: Old classSchedule.id, absent ids, attendanceMarked per held class (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:142-155`)
- vNext now: New scheduleEventCourses, attendanceSessions, attendanceRecords (`src/modules/attendance/learner-service.ts:135-219`)
- Fix: Crosswalk absent rows and marked session sentinel/late status in DB migrations.

## G2-18-009-059  [P1] GAP  facet F11  effort M
- Legacy: Legacy viewer faculty/admin/SA canMark; learner read-only (`AttendanceReport.js:15-18,94-98`).
- vNext now: New faculty workspace requires assigned teaching delivery and learner via distinct ACTIVE membership (`faculty-service.ts:116-127`; `learner-service.ts:44-89`).
- Fix: Verify college-admin/SA acting-in-college path has same attendance view; preserve no cross-tenant writes.

## G2-19-006-039  [P1] GAP  facet F10  effort L
- Legacy: Legacy GET records takes numeric courseId and startDate,endDate inclusive YYYY-MM-DD `docs/legacy-source/frontend/src/api/Services/attendanceServices.js:93-102` `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:158-163`
- vNext now: vNext query uses trusted IST monthWindow half-open UTC from/to and delivery scope `src/app/(authenticated)/learn/attendance/page.tsx:17-25` `src/modules/attendance/learner-attendance-calendar-model.ts:103-115` `src/modules/attendance/learner-service.ts:236-245`
- Fix: Verify month-end timezone boundary, migrating class schedule joins/IDs.

## G2-19-006-040  [P1] GAP  facet F10  effort L
- Legacy: Legacy attendance result shape `{classes, absentids}` `docs/legacy-source/frontend/src/api/Services/attendanceServices.js:93-102`
- vNext now: vNext returns normalized typed attendanceRecords with sessionStatus, recordStatus `src/modules/attendance/learner-service.ts:247-258`
- Fix: Build parity adapter for all old absence semantics and mark provenance.

## G2-19-006-074  [P1] GAP  facet F21  effort L
- Legacy: Legacy attendance page API imports attendanceServices, Redux attendanceAction and route Utils `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:19-26`
- vNext now: vNext uses typed learner-service + DB normalized deliveries/records `src/app/(authenticated)/learn/attendance/page.tsx:1-25` `src/modules/attendance/learner-service.ts:92-135`
- Fix: Document API/object mapping and current vs historical enrollment semantics.

## G2-19-006-076  [P1] GAP  facet F22  effort L
- Legacy: Legacy records API `{classes, absentids}` keyed classScheduleId `docs/legacy-source/frontend/src/api/Services/attendanceServices.js:93-102` `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:180-186`
- vNext now: vNext sectionScheduleEventCourses and attendanceRecords per membership/delivery `src/modules/attendance/learner-service.ts:135-215` `src/modules/attendance/learner-service.ts:247-258`
- Fix: Create old classScheduleId→scheduleEvent/delivery/membership migration map with correct absence row.

## G2-19-006-077  [P1] GAP  facet F22  effort L
- Legacy: Legacy single numeric courseId selects attendance, independent of sections `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:146-163`
- vNext now: vNext UUID deliveryId required for per-section course and active academic period `src/modules/attendance/learner-attendance-filter-model.ts:17-28` `src/modules/attendance/learner-service.ts:260-269`
- Fix: Handle migrated duplicate course deliveries and preserve historical attendance visibility.

## G2-2-032-011  [P1] GAP  facet F01  effort L
- Legacy: ClassScheduleController.java:472-519 own learner schedule+absent IDs and threshold.
- vNext now: src/modules/attendance/learner-service.ts learner-scoped attendance reports, schedule-service.ts:54-209 calendar.
- Fix: Combine exact threshold, missed sessions and course-specific schedule view where old client expects it.

## G2-2-032-057  [P1] GAP  facet F10  effort L
- Legacy: ClassScheduleController.java:488-519 GET learner absent sessions with course selection and threshold.
- vNext now: src/modules/attendance/learner-service.ts learner-specific attendance and schedule events separate.
- Fix: Provide consistent combined learner-course absence summary or documented split and UI join.

## G2-2-032-102  [P1] GAP  facet F23  effort L
- Legacy: ClassScheduleController.java:394-519 attendance summaries include course slug and threshold.
- vNext now: src/modules/attendance/learner-service.ts and admin-service.ts split views.
- Fix: Owner should decide combined API parity vs separate endpoints, keep exact content.

## G2-5-027-045  [P1] GAP  facet F10  effort M
- Legacy: Legacy mark absence writes Attend and updates ClassSchedule attendanceTaken, with audit per write. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:801-896`
- vNext now: vNext learner-facing attendance read backed by attendanceSessions/attendanceRecords; writer elsewhere. `src/modules/attendance/learner-service.ts:59-125`
- Fix: Verify absent/present transaction and audit record parity on faculty writer.

## G2-5-027-080  [P1] GAP  facet F21  effort M
- Legacy: Legacy attendance/class schedule services mark taken and audit. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:801-896`
- vNext now: vNext attendance records/sessions are different persisted primitives. `src/modules/attendance/learner-service.ts:59-125`
- Fix: Validate class-schedule-to-session mapping for old attendance history.

## G2-5-027-082  [P1] GAP  facet F22  effort M
- Legacy: Legacy Attend absence row with soft-delete on present and class_schedule attendanceTaken. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:801-895`
- vNext now: vNext attendanceSessions and attendanceRecords with explicit status enum and timestamps. `src/modules/attendance/learner-service.ts:13-24`
- Fix: Model equivalent absence deletion vs PRESENT status and markedAt history.
