# Work packet: edit src/modules/attendance/faculty-grid-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u009-teacher-attendance-view.md

## G2-14-009-018  [P1] GAP  facet F04  effort M
- Legacy: Absences represented by list of absent schedule IDs `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassScheduleServiceImpl.java:866-891`
- vNext now: Records include excused medical late and all are interpreted absence-like `src/modules/attendance/faculty-grid-model.ts:80-115`
- Fix: Determine policy for excused medical late before counting each as absent

## G2-14-009-025  [P1] GAP  facet F05  effort S
- Legacy: Mixed-day ratio only divides by held sessions `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:348-397`
- vNext now: Ratio denominator counts all sessions including future `src/modules/attendance/faculty-grid-model.ts:117-173`
- Fix: Exclude future sessions from ratio denominator
