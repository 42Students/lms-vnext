# Work packet (wave 2): edit src/components/attendance/learner-attendance-workspace.tsx (part 2 of 2)

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/course-attendance-report.md, docs/audit/gap2/lane-19/learner-attendance.md

## G2-18-009-070  [P3] GAP  facet F13  effort S
- Legacy: Legacy learner empty `No classes in this period` (`StudentAttendanceView.jsx:135-149`).
- vNext now: New `No attendance records`/`No classes scheduled for this month. Try selecting a different period.` (`learner-attendance-workspace.tsx:531-541`).
- Fix: Restore exact empty phrase when truly no rows.

## G2-19-006-008  [P3] GAP  facet F03  effort S
- Legacy: Legacy filter Course uses BookOutlined icon `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:388-392`
- vNext now: vNext Course label and Select no book icon `src/components/attendance/learner-attendance-workspace.tsx:278-300`
- Fix: Restore icon and text alignment.

## G2-19-006-010  [P3] GAP  facet F03  effort S
- Legacy: Legacy Prev/Next month left/right icon controls `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:404-423`
- vNext now: vNext textual left/right arrows inside secondary Buttons `src/components/attendance/learner-attendance-workspace.tsx:303-347`
- Fix: Use same icon weight, size and filter-bar placement.

## G2-19-006-065  [P3] GAP  facet F18  effort S
- Legacy: Legacy metric labels `N Total`, `N Present`, `N Absent` `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:350-366`
- vNext now: vNext labels separate from numeric, adds Held/Attendance `src/components/attendance/learner-attendance-workspace.tsx:366-401`
- Fix: Match compact metric label grammar and styling.
