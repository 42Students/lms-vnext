# Work packet: edit src/app/(authenticated)/learn/attendance/page.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/course-attendance-report.md, docs/audit/gap2/lane-19/learner-attendance.md

## G2-18-009-035  [P1] GAP  facet F07  effort M
- Legacy: Legacy learner error `Failed to load attendance.` Alert plus Retry (`StudentAttendanceView.jsx:37-69`).
- vNext now: New SSR course/month loader does not show this in-page alert in workspace (`learn/attendance/page.tsx:19-25`; `learner-attendance-workspace.tsx:163-175`).
- Fix: Add attendance-scoped error state with exact legacy copy and Retry instead of route failure.

## G2-19-006-039  [P1] GAP  facet F10  effort L
- Legacy: Legacy GET records takes numeric courseId and startDate,endDate inclusive YYYY-MM-DD `docs/legacy-source/frontend/src/api/Services/attendanceServices.js:93-102` `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:158-163`
- vNext now: vNext query uses trusted IST monthWindow half-open UTC from/to and delivery scope `src/app/(authenticated)/learn/attendance/page.tsx:17-25` `src/modules/attendance/learner-attendance-calendar-model.ts:103-115` `src/modules/attendance/learner-service.ts:236-245`
- Fix: Verify month-end timezone boundary, migrating class schedule joins/IDs.

## G2-19-006-074  [P1] GAP  facet F21  effort L
- Legacy: Legacy attendance page API imports attendanceServices, Redux attendanceAction and route Utils `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:19-26`
- vNext now: vNext uses typed learner-service + DB normalized deliveries/records `src/app/(authenticated)/learn/attendance/page.tsx:1-25` `src/modules/attendance/learner-service.ts:92-135`
- Fix: Document API/object mapping and current vs historical enrollment semantics.

## G2-19-006-029  [P2] GAP  facet F07  effort M
- Legacy: Legacy courses API failure shows toast `Could not load courses`, different 403 message `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:127-139`
- vNext now: vNext page `await getLearnerAttendanceWorkspace` with no separate partial lookup retry in wrapper `src/app/(authenticated)/learn/attendance/page.tsx:19-25`
- Fix: Handle course lookup error with exact message + retry without interpreting as zero courses.

## G2-19-006-030  [P2] GAP  facet F07  effort M
- Legacy: Legacy attendance request failure shows `Something went wrong loading attendance for this month.` and Retry `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:286-298`
- vNext now: vNext server read no per-month retry/local load banner `src/app/(authenticated)/learn/attendance/page.tsx:19-26` `src/components/attendance/learner-attendance-workspace.tsx:531-535`
- Fix: Add explicit error/Retry distinct from empty session state.

## G2-19-006-032  [P2] GAP  facet F08  effort S
- Legacy: Legacy courses failure notification bottomRight duration5 icon error `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:132-138`
- vNext now: vNext no course-specific toast, renders page from server `src/app/(authenticated)/learn/attendance/page.tsx:19-26`
- Fix: Use visible course load warning and legacy duration/position.
