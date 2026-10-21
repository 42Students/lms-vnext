# Work packet: edit src/modules/attendance/faculty-marking-window.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/take-attendance.md

## G2-15-009-053  [P1] GAP  facet F12  effort L
- Legacy: Legacy Ready to mark regardless of scheduled time (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:294-297`)
- vNext now: New denies before start and after correction window (`src/modules/attendance/faculty-marking-window.ts:17-31`)
- Fix: Resolve product timing policy and align UI/server, including historical marks
