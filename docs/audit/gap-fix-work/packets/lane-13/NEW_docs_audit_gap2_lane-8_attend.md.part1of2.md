# Work packet: NEW / MISSING items from docs/audit/gap2/lane-8/attend.md (part 1 of 2)

20 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-8/attend.md

## G2-8-021-001  [P1] GAP  facet F01  effort M
- Legacy: Absence record links a learner string ID to integer class schedule; no direct course/class key (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Attend.java:16-27).
- vNext now: vNext record references a UUID membership and UUID section schedule event (src/db/schema/attendance.ts:110-123).
- Fix: Publish exact learnerId/classScheduleId to membershipId/eventId crosswalk; preserve scoped lookup.

## G2-8-021-009  [P1] GAP  facet F04  effort M
- Legacy: Legacy stored `student_id` is a String (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Attend.java:16-18).
- vNext now: New attendance record uses membership UUID foreign key (src/db/schema/attendance.ts:119-123).
- Fix: Define migration mapping for historical string student IDs and collision handling.

## G2-8-021-010  [P1] GAP  facet F04  effort M
- Legacy: Legacy `class_schedule_id` is int (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Attend.java:24-25).
- vNext now: New scheduleEventId references sectionScheduleEvents UUID (src/db/schema/attendance.ts:114-118).
- Fix: Backfill session identities and preserve historical schedule-to-course associations.

## G2-8-021-012  [P1] GAP  facet F04  effort M
- Legacy: Legacy nullable attendance_status codes EXCUSED, MEDICAL, LATE; NULL means unexplained ABSENT (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Attend.java:36-44).
- vNext now: New status NOT NULL and supports PRESENT, ABSENT, EXCUSED, MEDICAL, LATE (src/db/schema/attendance.ts:124-126,165-168).
- Fix: Transform null to ABSENT, preserve explicit status, check historical excused treatment.

## G2-8-021-013  [P1] GAP  facet F04  effort M
- Legacy: Legacy marked_by nullable for pre-migration entries (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Attend.java:29-36; docs/legacy-source/backend/src/main/resources/db/migration/V128__attendance_marked_by_and_status.sql:10-21).
- vNext now: New markedByUserId NOT NULL FK (src/db/schema/attendance.ts:128-134).
- Fix: Allow an explicit historical unknown/system marker path during migration rather than inventing a faculty ID.

## G2-8-021-017  [P1] GAP  facet F05  effort M
- Legacy: Legacy teacher load is scoped by classId and course ID/slug and facultyId (docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:43-66).
- vNext now: New admin grid fetches by deliveryId and YYYY-MM month (src/modules/attendance/admin-service.ts:282-296).
- Fix: Keep a visible class-course-faculty mapping and prevent silently selecting the wrong term/delivery.

## G2-8-021-019  [P1] GAP  facet F06  effort M
- Legacy: Legacy optional free-form dropClassReason from DTO (docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/AttendanceDTO.java:21-22).
- vNext now: New admin correction strict schema has no note/reason input (src/modules/attendance/admin-service.ts:49-60).
- Fix: Add optional admin correction reason/note with clear length rule and persistence.

## G2-8-021-036  [P1] GAP  facet F10  effort M
- Legacy: Legacy removeAbsence performs soft delete (isDeleted true) and can later revive same row (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerServiceImpl.java:570-602,633-646).
- vNext now: New PRESENT correction physically deletes the exception row (src/modules/attendance/admin-service.ts:538-554).
- Fix: Retain immutable correction history with original row identity or explicit historical event migration.

## G2-8-021-042  [P1] GAP  facet F12  effort M
- Legacy: Legacy percentage counts all held schedules minus absent records, including schedules without attendance taken in some service paths (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerServiceImpl.java:848-861).
- vNext now: New learner summary excludes unmarked sessions from denominator (src/modules/attendance/model.ts:61-89).
- Fix: Pick one policy for eligibility and reports, reconcile historical percentages visibly.

## G2-8-021-043  [P1] GAP  facet F12  effort M
- Legacy: Legacy admin bypasses end-time correction window, but future-time validation still executes in attend() (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerServiceImpl.java:533-556).
- vNext now: New admin code expressly allows pre-session corrections (src/modules/attendance/admin-service.ts:507-511).
- Fix: Prevent pre-start correction until session starts unless an owner-approved new rule.

## G2-8-021-059  [P1] GAP  facet F20  effort M
- Legacy: Legacy revoked absence row retained with is_deleted true and revision clock, permitting reactivation (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerServiceImpl.java:570-602,635-645).
- vNext now: New physically removes PRESENT exception; activity audit retains event metadata in admin path (src/modules/attendance/admin-service.ts:538-554,611-631).
- Fix: Ensure audit log is sufficient for disputes and provide previous marker/reason in history.

## G2-8-021-064  [P1] GAP  facet F22  effort M
- Legacy: Legacy Attend inherits int identity, createdAt, updatedAt, isDeleted flag (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:22-38; docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Attend.java:11-15).
- vNext now: New records have UUID key, markedAt, updatedAt and no isDeleted (src/db/schema/attendance.ts:110-145).
- Fix: Write migration/compatibility strategy for historic primary keys and soft-delete chronology.

## G2-8-021-066  [P1] GAP  facet F22  effort M
- Legacy: Legacy attended session flag lives on class_schedule.attendance_marked_at (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ClassSchedule.java:30-35).
- vNext now: New attendance_sessions separate table enforces markedBy+markedAt for MARKED rows (src/db/schema/attendance.ts:63-107).
- Fix: Backfill attendance_sessions from historical marker timestamps; do not infer all-present from no absence rows.

## G2-8-021-069  [P1] GAP  facet F23  effort M
- Legacy: Legacy soft-deleted row retains dropClassReason, marker and prior timestamps (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Attend.java:26-44; docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:28-37).
- vNext now: New delete on PRESENT removes per-cell reason/marker row (src/modules/attendance/admin-service.ts:538-554).
- Fix: Expose durable per-cell change history for disputed attendances and reason trails.

## G2-8-021-024  [P2] GAP  facet F07  effort M
- Legacy: Legacy learner not in class says Student does not belong to this class schedule's class (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerServiceImpl.java:525-530).
- vNext now: New roster error ATTENDANCE_ROSTER_CONFLICT (src/modules/attendance/admin-service.ts:444-461).
- Fix: Provide member-specific, non-leaking roster mismatch message and retry path.

## G2-8-021-025  [P2] GAP  facet F07  effort M
- Legacy: Legacy future-session error: Cannot mark attendance for a class that has not started yet (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerServiceImpl.java:533-541).
- vNext now: New ATTENDANCE_NOT_STARTED code on faculty mark (src/modules/attendance/faculty-service.ts:539-548).
- Fix: Match exact future-class message at API and UI.

## G2-8-021-026  [P2] GAP  facet F07  effort M
- Legacy: Legacy retroactive error embeds configured N hours (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerServiceImpl.java:542-556).
- vNext now: New ATTENDANCE_CORRECTION_WINDOW_EXPIRED has no duration in code (src/modules/attendance/faculty-service.ts:533-548).
- Fix: Include configured correctionWindowHours in visible error.

## G2-8-021-027  [P2] GAP  facet F07  effort M
- Legacy: Legacy bulk empty lists: Nothing to record — provide at least one absent or present learner (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AttendanceBulkController.java:92-99).
- vNext now: New faculty submission enforces full roster, not this exact validation (src/modules/attendance/faculty-service.ts:468-486).
- Fix: Show precise empty-roster vs unchanged-mark distinction.

## G2-8-021-028  [P2] GAP  facet F07  effort M
- Legacy: Legacy admin invalid status: status must be one of EXCUSED, MEDICAL, LATE (or omitted for a plain absence) (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAttendanceController.java:290-294).
- vNext now: New strict z.enum rejects invalid enum with generic validation envelope (src/modules/attendance/admin-service.ts:49-60).
- Fix: Map status enum rejection to helpful legacy wording.

## G2-8-021-029  [P2] GAP  facet F08  effort M
- Legacy: Legacy correction success response Marked absent (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAttendanceController.java:305-311).
- vNext now: New admin correction returns receipt object in JSON result (src/app/api/attendance/admin/sessions/[scheduleEventId]/route.ts:29-36).
- Fix: Show exact Marked absent confirmation for ABSENT correction.
