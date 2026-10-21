# Work packet: edit src/modules/attendance/faculty-service.ts (part 2 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/attendance-present-absent-button.md, docs/audit/gap2/lane-2/attendance-bulk-controller.md, docs/audit/gap2/lane-3/course-student-roster.md, docs/audit/gap2/lane-3/l15-u031-learning-flow-cross-cutting.md, docs/audit/gap2/lane-8/attend.md

## G2-19-009-056  [P1] GAP  facet F22  effort L
- Legacy: Old numeric classScheduleId and static reason `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:493-501`
- vNext now: vNext UUID scheduleEventId, markedAt optimistic token, correctionReason `src/modules/attendance/faculty-service.ts:69-76` `src/modules/attendance/faculty-service.ts:550-570`
- Fix: Map legacy class schedules to event/membership/version fields.

## G2-2-027-014  [P1] GAP  facet F04  effort M
- Legacy: AttendanceBulkController.java:169-177 returns markedAbsent/markedPresent/failed[]/attendanceComplete and wrapper message.
- vNext now: faculty-service.ts:701-710 returns scheduleEventId,markedAbsent,markedPresent,markedAt; route :33 wraps in `{result}`.
- Fix: Expose saved/completion state and partial failure semantics if retaining legacy client contract; otherwise migrate feedback.

## G2-2-027-031  [P1] GAP  facet F07  effort L
- Legacy: AttendanceBulkController.java:207-214 per-student failure row `studentId,intent,reason`.
- vNext now: faculty-service.ts:488-710 transaction fails all on a bad row; UI :420-435 shows aggregate error.
- Fix: Record and display per-row validation failures if partial-save contract preserved; otherwise document intentionally atomic semantics.

## G2-2-027-036  [P1] GAP  facet F08  effort M
- Legacy: AttendanceBulkController.java:174-177 partial success returns HTTP 200 and message `Attendance partly saved...`.
- vNext now: faculty-service.ts:488-710 is atomic and cannot return partial status.
- Fix: Owner decision: preserve partial-save semantics or explicitly document atomic change and remove legacy retry-only-failed UX.

## G2-2-027-048  [P1] GAP  facet F11  effort L
- Legacy: AttendanceBulkController.java:184-194 explicitly exempts College Admin facultyType ADMIN and superadmin from teach-this-class.
- vNext now: faculty-service.ts:142-205 requires active FACULTY teaching role; no admin exception in this endpoint.
- Fix: Add separate permissioned College Admin/Super Admin mark path if legacy parity needed; never weaken teacher scoped route.

## G2-2-027-051  [P1] GAP  facet F12  effort M
- Legacy: TakeAttendance.js:294-297 explicitly says time-gating removed; `Ready to mark` before class starts.
- vNext now: faculty-service.ts:539-548 rejects NOT_STARTED and past correction window.
- Fix: Owner decision: align time policy; if intentionally stricter, document and adjust legacy compare checklist.

## G2-2-027-052  [P1] GAP  facet F12  effort M
- Legacy: AttendanceBulkController.java:94-98 accepts partial set of absent/present, not necessarily full class roster.
- vNext now: faculty-service.ts:468-485 requires full active-roster coverage.
- Fix: Choose partial vs full-roster contract and keep UI/validation consistent; atomic roster control is safer.

## G2-2-027-053  [P1] GAP  facet F12  effort L
- Legacy: AttendanceBulkController.java:127-146 allows per-student partial processing and independent errors.
- vNext now: faculty-service.ts:488-642 writes whole roster and status transactionally.
- Fix: Decide explicit business semantic change and update retry/partial messaging, support per-row failure preview if desired.

## G2-2-027-092  [P1] GAP  facet F22  effort L
- Legacy: AttendanceBulkController.java:73-79 takes legacy classScheduleId/studentId.
- vNext now: faculty-service.ts:69-76 takes scheduleEventId and membership UUID, scoped delivery UUID.
- Fix: Provide immutable identity mapping and cross-college tenancy validation during import.

## G2-2-027-094  [P1] GAP  facet F23  effort M
- Legacy: AttendanceBulkController.java:127-146 partial learner failures possible in one HTTP 200 batch.
- vNext now: faculty-service.ts:488-710 strictly atomic transaction, no failed[] response.
- Fix: Explicit product decision: intentional atomic improvement vs requirement to match partial-save/retry behavior.

## G2-2-027-096  [P1] GAP  facet F23  effort M
- Legacy: TakeAttendance.js:294-297 non-time-gated policy deliberate.
- vNext now: faculty-service.ts:539-548 strictly gates class start + correction window24h.
- Fix: Obtain owner policy signoff and distinguish intentional change from CSS clone issue.

## G2-3-009-028  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:245-251`
- vNext now: `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx:27-31`; `src/modules/attendance/faculty-service.ts:1-40`
- Fix: Legacy GET `/api/v1/learner/getLearnerDetailsByClassId?classId=n`, vNext service `getFacultyDeliveryRoster` keyed deliveryId UUID; map eligible active class roster, test legacy deep link.

## G2-15-031-062  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:112-146`
- vNext now: `src/modules/attendance/faculty-service.ts:17-40`
- Fix: Old absent flag and schedule ID vs new attendance session+record and correction audit; unknown distinction.

## G2-8-021-034  [P1] GAP  facet F10  effort M
- Legacy: Legacy POST /api/v1/attendance/bulk takes classScheduleId, absentStudentIds, presentStudentIds and reason (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AttendanceBulkController.java:44-45,72-87).
- vNext now: New PATCH /api/attendance/faculty/sessions/{eventId} accepts deliveryId, absentMembershipIds, presentMembershipIds, expectedMarkedAt, correctionReason (src/app/api/attendance/faculty/sessions/[scheduleEventId]/route.ts:13-33; src/modules/attendance/faculty-service.ts:69-76).
- Fix: Document endpoint/payload migration, method change and role-scoped ID mapping.

## G2-2-027-026  [P2] GAP  facet F07  effort S
- Legacy: AttendanceBulkController.java:89-90 returns `classScheduleId is required`.
- vNext now: faculty-service.ts:451-460 rejects malformed UUID via z.string().uuid().
- Fix: Translate missing/invalid schedule to human readable same wording or new mapped ID context.

## G2-2-027-027  [P2] GAP  facet F07  effort S
- Legacy: AttendanceBulkController.java:94-98 returns `Nothing to record — provide at least one absent or present learner`.
- vNext now: faculty-service.ts:468-485 raises ATTENDANCE_ROSTER_CONFLICT for incomplete roster.
- Fix: Differentiate empty submission from roster-changed conflict; show tailored action.

## G2-2-027-028  [P2] GAP  facet F07  effort M
- Legacy: AttendanceBulkController.java:100-102 returns `Maximum 500 learners per request`.
- vNext now: faculty-service.ts:72-73 validates max1000 in each array, default Zod error.
- Fix: Enforce combined 500 or explicitly approved higher roster cap with clear error.

## G2-2-027-029  [P2] GAP  facet F07  effort S
- Legacy: AttendanceBulkController.java:113-116 returns `Class schedule not found`.
- vNext now: faculty-service.ts:500-528 throws SCHEDULE_EVENT_NOT_FOUND for nonmatching schedule/delivery.
- Fix: Map not-found messages to old copy for same experience without leaking foreign IDs.

## G2-2-027-030  [P2] GAP  facet F07  effort S
- Legacy: AttendanceBulkController.java:202-204 error `You are not assigned to teach this class`.
- vNext now: faculty-service.ts:116-126 / :142-205 throws FACULTY_TEACHING_SCOPE_REQUIRED.
- Fix: Render exact teaching-scope denial in faculty UI; retain stronger persisted membership checks.

## G2-15-031-021  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:153-160`
- vNext now: `src/modules/attendance/faculty-service.ts:225-250`
- Fix: Old attendance failed-load copy vs new scoped backend errors.
