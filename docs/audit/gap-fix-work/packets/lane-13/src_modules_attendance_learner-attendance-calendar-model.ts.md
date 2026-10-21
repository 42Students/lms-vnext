# Work packet: edit src/modules/attendance/learner-attendance-calendar-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/learner-attendance.md

## G2-19-006-039  [P1] GAP  facet F10  effort L
- Legacy: Legacy GET records takes numeric courseId and startDate,endDate inclusive YYYY-MM-DD `docs/legacy-source/frontend/src/api/Services/attendanceServices.js:93-102` `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:158-163`
- vNext now: vNext query uses trusted IST monthWindow half-open UTC from/to and delivery scope `src/app/(authenticated)/learn/attendance/page.tsx:17-25` `src/modules/attendance/learner-attendance-calendar-model.ts:103-115` `src/modules/attendance/learner-service.ts:236-245`
- Fix: Verify month-end timezone boundary, migrating class schedule joins/IDs.

## G2-19-006-073  [P1] GAP  facet F20  effort M
- Legacy: Legacy date range uses moment().start/endOf month in user timezone `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:158-163`
- vNext now: vNext canonical Asia/Kolkata half-open month window `src/modules/attendance/learner-attendance-calendar-model.ts:103-115`
- Fix: Test timezone boundary differences for learners outside IST and DST devices.
