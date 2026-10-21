# Work packet (wave 2): edit src/modules/attendance/faculty-grid-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u009-teacher-attendance-view.md

## G2-14-009-024  [P2] GAP  facet F05  effort S
- Legacy: Future-only date cell appears No class glyph `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:328-335` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:409-417`
- vNext now: Future session represented as S Scheduled `src/modules/attendance/faculty-grid-model.ts:99-129`
- Fix: Use legacy no-class cell in month grid; retain scheduling in separate view

## G2-14-009-074  [P2] GAP  facet F20  effort M
- Legacy: Legacy uses local dayjs start/end date query `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:53-60`
- vNext now: Month key and group dates explicitly Asia/Kolkata `src/modules/attendance/faculty-grid-model.ts:24-54` `src/components/attendance/faculty-attendance-workspace.tsx:159-161`
- Fix: Test midnight and month-boundary equivalence

## G2-14-009-075  [P2] GAP  facet F20  effort S
- Legacy: Future sessions not counted as present or held `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:328-335` `docs/legacy-source/frontend/src/utils/attendanceConstants.js:18-20`
- vNext now: Future sessions excluded from present but rendered as S `src/modules/attendance/faculty-grid-model.ts:99-129`
- Fix: Align no-class display while preventing false present
