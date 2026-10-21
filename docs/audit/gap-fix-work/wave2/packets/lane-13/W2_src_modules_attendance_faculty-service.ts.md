# Work packet (wave 2): edit src/modules/attendance/faculty-service.ts

30 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u009-teacher-attendance-view.md, docs/audit/gap2/lane-15/take-attendance.md, docs/audit/gap2/lane-17/attendance-name-with-dp.md, docs/audit/gap2/lane-18/course-attendance-report.md, docs/audit/gap2/lane-19/attendance-present-absent-button.md, docs/audit/gap2/lane-2/attendance-bulk-controller.md

## G2-14-009-041  [P2] GAP  facet F10  effort M
- Legacy: GET filtered class schedules endpoint takes classId course slug/id facultyId start/end `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:53-67` `docs/legacy-source/frontend/src/api/serviceUrl.js:127-128`
- vNext now: Server reads delivery scoped sessions and records via Drizzle `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx:35-65` `src/modules/attendance/faculty-service.ts:225-368`
- Fix: Document field mapping and date-scope adapter

## G2-14-009-045  [P2] GAP  facet F10  effort M
- Legacy: Backend writes ATTENDANCE_MARK_BULK audit log counts `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AttendanceBulkController.java:156-167`
- vNext now: New writes COURSES_ATTENDANCE_MARKED activity including correction reason `src/modules/attendance/faculty-service.ts:646-669`
- Fix: Crosswalk admin audit event taxonomy and filters

## G2-14-009-076  [P2] GAP  facet F20  effort M
- Legacy: Legacy partial save retries failed learners only `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:517-548`
- vNext now: New atomic PATCH has version token and reload guidance `src/components/attendance/faculty-attendance-workspace.tsx:420-436` `src/modules/attendance/faculty-service.ts:550-570`
- Fix: Document retry/idempotency semantics

## G2-15-009-044  [P2] GAP  facet F10  effort M
- Legacy: Two GETs: studentsByClassScheduleId then attendanceByDateRange, with cancelled flag (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:100-168`)
- vNext now: Server workspace returns sections, roster, sessions, records (`src/modules/attendance/faculty-service.ts:225-359`)
- Fix: Prove selected date/class parity of response and stale request handling

## G2-15-009-057  [P2] GAP  facet F12  effort M
- Legacy: 500 total learners max (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AttendanceBulkController.java:100-102`)
- vNext now: Allows up to 1000 per present and absent array (`src/modules/attendance/faculty-service.ts:69-74`)
- Fix: Decide deliberate capacity increase and measure large roster

## G2-15-009-082  [P2] GAP  facet F20  effort S
- Legacy: End time can roll next day for midnight cross (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:555-575`)
- vNext now: Explicit date-time instants no inferred rollover (`src/modules/attendance/faculty-service.ts:45-67`)
- Fix: Retain overnight semantics in converted native picker

## G2-17-009-019  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:114-148 — Parent reads getStudentsListbyClassid then merges absence flags by learner_id.
- vNext now: src/modules/attendance/faculty-service.ts:133-133 — Roster fetched via listActiveDeliveryLearners.
- Fix: Confirm old learner_id mapping to new membershipId across imports.

## G2-17-009-034  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/NameWithDp.js:13 — Uses legacy `first_name`, `last_name` from student roster object.
- vNext now: src/modules/attendance/faculty-service.ts:324-327 — Queries users.displayName and learnerProfiles.rollNumber.
- Fix: Define import mapping from separate legacy first/last to displayName with reproducible order.

## G2-18-009-034  [P2] GAP  facet F06  effort M
- Legacy: Legacy ScheduleClassDrawer uses faculty/class IDs and date/start/end, no authoring location/title in parent payload (`TakeAttendance.js:204-262`).
- vNext now: New Schedule drawer requires Title max200, separate startsAt/endsAt ISO, Location max500 (`faculty-attendance-workspace.tsx:1180-1274`; `faculty-service.ts:41-66`).
- Fix: Retain new payload validation, map original time/date defaults, restore legacy drawer visuals.

## G2-18-009-055  [P2] GAP  facet F10  effort M
- Legacy: Legacy Mark GET roster by classScheduleId, joins absentees list (`TakeAttendance.js:100-168`; `attendanceServices.js:48-53`).
- vNext now: New currentDeliveryRoster by section/delivery, records by scheduleEventId/membershipId (`faculty-service.ts:129-139`; `faculty-attendance-workspace.tsx:206-215`).
- Fix: Confirm roster membership temporal alignment and historical attendee handling.

## G2-18-009-096  [P2] GAP  facet F21  effort M
- Legacy: Legacy attendance API calls Spring class/schedule/attendance endpoints, no third-party webhooks in page (`attendanceServices.js:13-81`).
- vNext now: New Drizzle and local faculty REST endpoints, activity notification service imported (`faculty-service.ts:13-15,41-105`).
- Fix: Confirm audit/activity emission and prevent notification duplication on bulk corrections.

## G2-19-009-053  [P2] GAP  facet F21  effort M
- Legacy: Old AntD icons and Redux, caller's attendanceServices `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AbsentPresntBtnCol.js:1-6` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:8-15`
- vNext now: vNext shared Button and TypeScript server service `src/components/attendance/faculty-attendance-workspace.tsx:15-26` `src/modules/attendance/faculty-service.ts:451-459`
- Fix: Map callback and API boundary in migration plan.

## G2-2-027-013  [P2] GAP  facet F04  effort M
- Legacy: AttendanceBulkController.java:73-79 expects classScheduleId integer; absentStudentIds/presentStudentIds string arrays and optional reason.
- vNext now: faculty-service.ts:69-76 accepts deliveryId UUID, absentMembershipIds/presentMembershipIds UUID arrays, expectedMarkedAt/correctionReason.
- Fix: Publish complete field mapping and explicitly derive deliveryId from selected scoped session.

## G2-2-027-021  [P2] GAP  facet F06  effort M
- Legacy: AttendanceBulkController.java:89-102 validates schedule id positive, both lists not empty, <=500 total.
- vNext now: faculty-service.ts:69-105 requires UUID ids, arrays max1000 each and validates uniqueness/disjoint, roster equality at :468-485.
- Fix: Decide explicit cap 500 versus 1000 each; enforce single combined cap plus exact over-limit error.

## G2-2-027-023  [P2] GAP  facet F06  effort M
- Legacy: AttendanceBulkController.java:73-79 `reason` optional, default `Mark Absent` in :127-133.
- vNext now: faculty-service.ts:69-75 `correctionReason` max500 optional, `faculty-attendance-workspace.tsx:1008-1018` required on corrections.
- Fix: Preserve first-submission reason/default and distinguish it from mandatory correction explanation.

## G2-2-027-042  [P2] GAP  facet F10  effort M
- Legacy: AttendanceBulkController.java:127-146 processes absent first then present per learner.
- vNext now: faculty-service.ts:573-617 removes present rows, deletes absent rows then inserts full absent set.
- Fix: Verify business ordering is preserved only for outcomes; atomic operation intentionally differs on individual failures.

## G2-2-027-044  [P2] GAP  facet F10  effort M
- Legacy: AttendanceBulkController.java:159-167 writes one ATTENDANCE_MARK_BULK audit row.
- vNext now: faculty-service.ts:649-669 writes single COURSES_ATTENDANCE_MARKED event with correction delta metadata.
- Fix: Map activity taxonomy copy and metadata keys for Admin Activity Log filter parity.

## G2-2-027-054  [P2] GAP  facet F12  effort S
- Legacy: Attend.java:25-26 persists reason free text on absent; `reason` optional controller.
- vNext now: faculty-service.ts:606-617 inserts ABSENT record without `note`; only correctionReason in event metadata.
- Fix: Persist initial absence reason in attendanceRecords.note where permitted; decide default `Mark Absent`.

## G2-2-027-065  [P2] GAP  facet F15  effort S
- Legacy: AttendanceBulkController.java:162-166 activity name ATTENDANCE_MARK_BULK with counts.
- vNext now: faculty-service.ts:649-669 activity type COURSES_ATTENDANCE_MARKED and delta metadata.
- Fix: Align old Activity Log display alias/filters with new event name and count labels.

## G2-2-027-078  [P2] GAP  facet F19  effort M
- Legacy: AttendanceBulkController.java:51-52,100-101 limits request to 500 learner IDs.
- vNext now: faculty-service.ts:72-73 allows 1000 absent and 1000 present, :468-485 requires exact roster coverage.
- Fix: Agree on max roster and SQL approach for larger cohorts; cap total input not per-array.

## G2-2-027-087  [P2] GAP  facet F21  effort M
- Legacy: AttendanceBulkController.java:55-70 relies on LearnerService, ClassScheduleService, AccessControlService, AuditLogService.
- vNext now: faculty-service.ts:12-39 directly uses Drizzle scoped roster, activity and in-app notification service.
- Fix: Document internal service composition and old->new attendance data path for migration.

## G2-2-027-095  [P2] GAP  facet F23  effort S
- Legacy: AttendanceBulkController.java:100-102 legacy max500 vs vNext max1000 for each list.
- vNext now: faculty-service.ts:69-76 checks duplicates and 1000 per list; :468-485 full roster.
- Fix: Choose tested max and document limits in UI, API and migration playbook.

## G2-2-032-009  [P2] GAP  facet F01  effort M
- Legacy: ClassScheduleController.java:344-393 attendance dashboard/student ID/roster reads.
- vNext now: src/modules/attendance/faculty-service.ts:142-205 and :468-485 scopes roster per schedule, no raw student ID alias in scheduling route.
- Fix: Preserve necessary staff roster and attendance summaries in authorized attendance module.

## G2-2-032-038  [P2] GAP  facet F06  effort S
- Legacy: ClassScheduleController.java:360-380 requires positive classScheduleId for roster/id lookup.
- vNext now: faculty-service.ts:69-76 requires valid UUID scheduleEventId.
- Fix: Map invalid ID to clear `Select a session` error and 404 for inaccessible.

## G2-2-032-056  [P2] GAP  facet F10  effort M
- Legacy: ClassScheduleController.java:344-355 attendance dashboard read per schedule.
- vNext now: src/modules/attendance/faculty-service.ts:142-205 roster/read controls.
- Fix: Adapt schedule id and roster summary fields to attendance workspace.

## G2-15-031-028  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:9-15`
- vNext now: `src/modules/attendance/faculty-service.ts:225-250`
- Fix: Legacy attendanceServices roster/mark absent/bulk actions vs scoped sessions/records.

## G2-15-031-048  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:50-71`
- vNext now: `src/modules/attendance/faculty-service.ts:69-108`
- Fix: Legacy unsaved attendance route change confirm vs vNext native/mutation guard unproven.

## G2-15-031-054  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:112-146`
- vNext now: `src/modules/attendance/faculty-service.ts:225-250`
- Fix: Old class roster+absence day loads vs session-based SQL.

## G2-15-031-059  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:9-15`
- vNext now: `src/modules/attendance/faculty-service.ts:17-40`
- Fix: Old attendance service vs new PG sessions and optional parent SMS.

## G2-2-032-086  [P3] GAP  facet F18  effort S
- Legacy: ClassScheduleController.java:98 `You are not assigned to teach any course in this learner's class`.
- vNext now: faculty-service.ts:116-126 emits faculty scope code.
- Fix: Map denial to precise own-section assignment message.
