# Work packet: edit src/modules/attendance/faculty-learner-attendance-detail.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u009-teacher-attendance-view.md

## G2-14-009-015  [P1] GAP  facet F04  effort M
- Legacy: Sessions and Active days count held sessions only `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:142-165`
- vNext now: Month sessionCount and Active days include future scheduled sessions `src/modules/attendance/faculty-learner-attendance-detail.ts:101-111` `src/components/attendance/faculty-attendance-workspace.tsx:635-642`
- Fix: Exclude future sessions from those legacy counts

## G2-14-009-051  [P1] GAP  facet F12  effort S
- Legacy: Held-only session count `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:142-173`
- vNext now: Includes future sessions in session count `src/modules/attendance/faculty-learner-attendance-detail.ts:101-119`
- Fix: Align held-only legacy label
