# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-8/attend.md

16 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-8/attend.md

## G2-8-021-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy attendance marking accessed in TakeAttendance from teacher monthly view (docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:3,112-114).
- vNext now: New faculty route writes PATCH event-scoped marks (src/app/api/attendance/faculty/sessions/[scheduleEventId]/route.ts:13-35).
- Fix: Ensure old course Attendance entry/deep-link opens the matching faculty event and preserves selection.

## G2-8-021-004  [P2] GAP  facet F02  effort M
- Legacy: Entity itself has no rendered sections; teacher view shows monthly class health followed by day grid (docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:188-216).
- vNext now: College page renders PageHeader, four tabs and admin workspace (src/app/(authenticated)/college/attendance/page.tsx:117-137).
- Fix: Cross-check old attendance page hierarchy and prevent extra nested canvas on role-equivalent pages.

## G2-8-021-006  [P2] GAP  facet F03  effort M
- Legacy: Teacher TakeAttendance table headers exactly Student Name and Status (docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:73-84).
- vNext now: New admin grid has per-day controls and status badge buttons (src/components/attendance/admin-attendance-workspace.tsx:527-552).
- Fix: Render original named roster/status headings in the equivalent marking surface.

## G2-8-021-008  [P2] GAP  facet F03  effort M
- Legacy: Legacy teacher can download monthly PDF via Download action (docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:175-185,221-225).
- vNext now: New admin has Export CSV control (src/components/attendance/admin-attendance-workspace.tsx:467-473).
- Fix: Preserve PDF on role-equivalent attendance reporting; CSV may remain an extra option.

## G2-8-021-011  [P2] GAP  facet F04  effort M
- Legacy: Legacy reason is drop_class_reason String with no explicit max in entity (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Attend.java:26-27).
- vNext now: New note VARCHAR(1000), separate status varchar(24) (src/db/schema/attendance.ts:124-127).
- Fix: Map free-form reason to note and document truncation/validation for over-1000 characters.

## G2-8-021-015  [P2] GAP  facet F05  effort M
- Legacy: Legacy repository returns attendance for one schedule ordered class_schedule_id DESC (same value) (docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/AttendanceRepository.java:15-16).
- vNext now: New grid sessions sort ascending startsAt, ID (src/modules/attendance/admin-service.ts:336-363).
- Fix: Verify table day ordering and deterministic row tie-break, map legacy attendance order intentionally.

## G2-8-021-018  [P2] GAP  facet F06  effort M
- Legacy: Legacy AttendanceDTO requires nonblank studentId and positive classScheduleId (docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/AttendanceDTO.java:13-19).
- vNext now: New PATCH uses UUID membershipId, deliveryId, collegeId and status enum (src/modules/attendance/admin-service.ts:48-60).
- Fix: Add precise field errors plus old ID adaptation for clients, with server-side roster guards.

## G2-8-021-020  [P2] GAP  facet F06  effort M
- Legacy: Legacy admin status query omitted for plain absence, accepts EXCUSED/MEDICAL/LATE after trim uppercase (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAttendanceController.java:277-294).
- vNext now: New admin correction body demands status including ABSENT and PRESENT as enum (src/modules/attendance/admin-service.ts:49-59).
- Fix: Support blank/plain absence semantic and document API translation.

## G2-8-021-021  [P2] GAP  facet F06  effort M
- Legacy: Legacy bulk roster maximum 500 and allows missing absent/present arrays as empty (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AttendanceBulkController.java:51-52,89-102).
- vNext now: New faculty arrays each max 1000 and default [] (src/modules/attendance/faculty-service.ts:69-76).
- Fix: Set an explicit total roster cap aligned with old 500 or record an approved intentional change.

## G2-8-021-035  [P2] GAP  facet F10  effort M
- Legacy: Legacy POST /api/v1/admin/attendance/mark-absent/mark-present perform one-row correction (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAttendanceController.java:277-311,323-343).
- vNext now: New PATCH /api/attendance/admin/sessions/{eventId} performs correction (src/app/api/attendance/admin/sessions/[scheduleEventId]/route.ts:13-36).
- Fix: Preserve correct status/note/history semantics for existing correction callers.

## G2-8-021-046  [P2] GAP  facet F13  effort M
- Legacy: Legacy GET /record rejects unavailable repository with 503 Attendance data is temporarily unavailable (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAttendanceController.java:220-227).
- vNext now: New admin DB read uses query directly; page may route through generic exception boundary (src/modules/attendance/admin-service.ts:374-415).
- Fix: Provide explicit recoverable attendance-data unavailable state, not an assumed present mark.

## G2-8-021-050  [P2] GAP  facet F15  effort M
- Legacy: Legacy correction-to-present uses attendanceCorrectionTemplate SMS after soft delete (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerServiceImpl.java:633-674).
- vNext now: New enqueues CORRECTED only if previous status ABSENT and new PRESENT (src/modules/attendance/admin-service.ts:632-638).
- Fix: Decide how EXCUSED/MEDICAL/LATE -> PRESENT corrections notify guardians; document intentional exclusion.

## G2-8-021-055  [P2] GAP  facet F18  effort M
- Legacy: Legacy table headers Student Name, Status (docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:73-84).
- vNext now: New correction drawer action uses capitalized status values Present, Absent, Excused, Medical, Late (src/components/attendance/admin-attendance-workspace.tsx:654-676).
- Fix: Preserve role-specific display copy and original header casing.

## G2-8-021-056  [P2] GAP  facet F18  effort M
- Legacy: Legacy read success says Attendance record and missing says No absence recorded or Attendance not yet taken for this session (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAttendanceController.java:228-249).
- vNext now: New status cell labels Not marked, Scheduled, Present/Absent etc (src/modules/attendance/admin-grid-model.ts:83-110).
- Fix: Map exact detail help text and unmarked explanatory copy rather than only shorthand badge.

## G2-8-021-063  [P2] GAP  facet F21  effort M
- Legacy: Legacy bulk audit entry ATTENDANCE_MARK_BULK recorded in admin audit log (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AttendanceBulkController.java:156-167).
- vNext now: New event COURSES_ATTENDANCE_MARKED in activityEvents and learner notification delivery (src/modules/attendance/faculty-service.ts:648-699).
- Fix: Preserve old audit action aliases and counts for audit-query parity.

## G2-8-021-067  [P2] GAP  facet F22  effort M
- Legacy: Legacy VARCHAR(20) attendance_status nullable added via V128 migration (docs/legacy-source/backend/src/main/resources/db/migration/V128__attendance_marked_by_and_status.sql:17-21).
- vNext now: New status VARCHAR(24) NOT NULL with DB check of five codes (src/db/schema/attendance.ts:124-126,165-168).
- Fix: Validate every historical status against new enum and map null semantics explicitly.
