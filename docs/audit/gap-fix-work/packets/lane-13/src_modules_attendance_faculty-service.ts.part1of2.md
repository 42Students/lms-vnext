# Work packet: edit src/modules/attendance/faculty-service.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u009-teacher-attendance-view.md, docs/audit/gap2/lane-15/take-attendance.md, docs/audit/gap2/lane-18/course-attendance-report.md, docs/audit/gap2/lane-19/attendance-present-absent-button.md

## G2-14-009-043  [P1] GAP  facet F10  effort L
- Legacy: Legacy mark POST bulk uses classScheduleId and learner IDs `docs/legacy-source/frontend/src/api/Services/attendanceServices.js:13-24` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:488-501`
- vNext now: PATCH faculty sessions uses deliveryId plus UUID membership arrays `src/components/attendance/faculty-attendance-workspace.tsx:401-419` `src/modules/attendance/faculty-service.ts:451-485`
- Fix: Map legacy and new ID semantics and reconcile API clients

## G2-14-009-044  [P1] GAP  facet F10  effort M
- Legacy: Bulk backend commits independently per learner and reports partial failures `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AttendanceBulkController.java:39-42` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AttendanceBulkController.java:123-145`
- vNext now: New validates complete roster and writes transactionally `src/modules/attendance/faculty-service.ts:468-486` `src/modules/attendance/faculty-service.ts:488-644`
- Fix: Keep safer atomic design but make outcome contract explicit

## G2-14-009-046  [P1] GAP  facet F11  effort L
- Legacy: Faculty and admins share attendance report and mark tabs `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:14-19` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:75-98`
- vNext now: Faculty route requires teaching assignment; admin oversight separate `src/modules/attendance/faculty-service.ts:116-126` `src/modules/attendance/faculty-service.ts:142-204`
- Fix: Provide equivalent admin route and permissions matrix

## G2-14-009-047  [P1] GAP  facet F11  effort M
- Legacy: Whole-class legacy GET enforces class and faculty scope, SA exempt `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassScheduleController.java:437-469`
- vNext now: New scopes to current membership and current delivery roster `src/modules/attendance/faculty-service.ts:116-139` `src/modules/attendance/faculty-service.ts:225-251`
- Fix: Crosswalk faculty college-admin and SA authorization

## G2-14-009-071  [P1] GAP  facet F19  effort L
- Legacy: Legacy fetch is month-scoped and refetches when month changes `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:42-99`
- vNext now: New fetches entire delivery history once and filters client-side `src/modules/attendance/faculty-service.ts:253-368` `src/components/attendance/faculty-attendance-workspace.tsx:290-303`
- Fix: Add date-scoped DB read for long histories

## G2-14-009-079  [P1] GAP  facet F22  effort L
- Legacy: Old class_schedule integer IDs and string timestamps plus marked_at `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ClassSchedule.java:10-35`
- vNext now: New UUID schedule/delivery and timestamptz attendance session `src/modules/attendance/faculty-service.ts:253-300` `src/db/schema/attendance.ts:63-107`
- Fix: Document migration map for class/course/faculty/session

## G2-15-009-014  [P1] GAP  facet F04  effort L
- Legacy: Roster student learner_id plus absence by studentId and classScheduleId (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:114-150`)
- vNext now: Enrollment membership UUIDs, session UUIDs and attendance rows (`src/modules/attendance/faculty-service.ts:225-359`)
- Fix: Prove old learner/class ID crosswalk to new membership/delivery and historical rosters

## G2-15-009-035  [P1] GAP  facet F07  effort M
- Legacy: classScheduleId required, nonempty mark arrays and 500 total max (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AttendanceBulkController.java:89-101`)
- vNext now: UUID input, 1000 max per array, disjoint/unique rules (`src/modules/attendance/faculty-service.ts:69-105`)
- Fix: Set explicit class cohort limit and user-visible server error contract

## G2-15-009-046  [P1] GAP  facet F10  effort M
- Legacy: Per learner committed writes, partial success possible, only all-success completes session (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AttendanceBulkController.java:127-153`)
- vNext now: One transaction deletes/creates absences and marks session (`src/modules/attendance/faculty-service.ts:573-643`)
- Fix: Retain atomic model, document change to error/retry and old partial history

## G2-15-009-049  [P1] GAP  facet F10  effort L
- Legacy: class_schedule inserted with numeric faculty,class,course,lecture hall links (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassScheduleServiceImpl.java:372-379`)
- vNext now: New section events + course delivery link + activity (`src/modules/attendance/faculty-service.ts:411-445`)
- Fix: Crosswalk assignments and preserve conflicts/session ownership

## G2-15-009-051  [P1] GAP  facet F11  effort M
- Legacy: Admin and superadmin exempt from teaching assignment checks (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AttendanceBulkController.java:180-205`)
- vNext now: Faculty service requires delivery; admin path separate (`src/modules/attendance/faculty-service.ts:123-124`)
- Fix: Verify admin-equivalent marking/correction flow covers original admin exception

## G2-15-009-054  [P1] GAP  facet F12  effort M
- Legacy: Front DatePicker explicitly permits past dates (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Attendance/SheduleClassDrawer.js:126-129`)
- vNext now: New service rejects starts older than default 5-minute grace (`src/modules/attendance/faculty-service.ts:59-66`)
- Fix: Resolve legacy frontend/backend contradiction; explain past booking constraint

## G2-15-009-085  [P1] GAP  facet F22  effort L
- Legacy: class_schedule numeric IDs, string timestamps, nullable markedAt (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ClassSchedule.java:15-35`)
- vNext now: New section events/delivery UUID join and separate sessions (`src/modules/attendance/faculty-service.ts:254-300`)
- Fix: Write historical ID/timezone/status backfill mapping

## G2-18-009-059  [P1] GAP  facet F11  effort M
- Legacy: Legacy viewer faculty/admin/SA canMark; learner read-only (`AttendanceReport.js:15-18,94-98`).
- vNext now: New faculty workspace requires assigned teaching delivery and learner via distinct ACTIVE membership (`faculty-service.ts:116-127`; `learner-service.ts:44-89`).
- Fix: Verify college-admin/SA acting-in-college path has same attendance view; preserve no cross-tenant writes.

## G2-18-009-060  [P1] GAP  facet F11  effort M
- Legacy: Legacy admin oversight GET can view any faculty's class in scoped college (`AdminAttendanceController.java:33-41,94-110`).
- vNext now: New faculty service only assigned-delivery (`faculty-service.ts:116-127`).
- Fix: Use distinct admin oversight service permissions rather than faculty membership impersonation.

## G2-19-009-023  [P1] GAP  facet F08  effort L
- Legacy: Old partial failure specifies N recorded / M failed, names and retry failed only `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:503-536`
- vNext now: vNext service writes atomically, client error via errorMessage `src/modules/attendance/faculty-service.ts:488-520` `src/components/attendance/faculty-attendance-workspace.tsx:120-139`
- Fix: Explain atomic rejection and list offending learner IDs without replay.

## G2-19-009-028  [P1] GAP  facet F10  effort L
- Legacy: Old final POST `/api/v1/attendance/bulk` numeric classScheduleId and learnerIDs `docs/legacy-source/frontend/src/api/Services/attendanceServices.js:16-20` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:493-501`
- vNext now: vNext server markFacultyAttendance takes UUID scheduleEventId, deliveryId, present/absent membership IDs `src/modules/attendance/faculty-service.ts:451-479`
- Fix: Document full field/type map and preserve all-roster update.

## G2-19-009-031  [P1] GAP  facet F11  effort M
- Legacy: Old row can mark before session start, per Ready to mark comment `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:293-297`
- vNext now: vNext explicitly denies until session started and past correction window `src/components/attendance/faculty-attendance-workspace.tsx:855-861` `src/modules/attendance/faculty-service.ts:533-548`
- Fix: Owner decide whether intentional; show disabled reason.

## G2-19-009-033  [P1] GAP  facet F12  effort M
- Legacy: Old reason sent as static Mark Absent `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:493-501`
- vNext now: vNext 8-character required correction reason for already MARKED session `src/components/attendance/faculty-attendance-workspace.tsx:353-361` `src/modules/attendance/faculty-service.ts:550-561`
- Fix: Explain written correction policy; differentiate first mark.

## G2-19-009-055  [P1] GAP  facet F22  effort L
- Legacy: Old learner_id with boolean isAbsent `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:138-149` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AbsentPresntBtnCol.js:8-9`
- vNext now: vNext membership UUID / attendanceRecords.status enum ABSENT `src/components/attendance/faculty-attendance-workspace.tsx:47-53` `src/modules/attendance/faculty-service.ts:606-618`
- Fix: Map legacy learner/session IDs and recorded absence status in migrations.
