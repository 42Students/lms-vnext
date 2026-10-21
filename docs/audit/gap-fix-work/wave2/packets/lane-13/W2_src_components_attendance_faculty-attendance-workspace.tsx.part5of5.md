# Work packet (wave 2): edit src/components/attendance/faculty-attendance-workspace.tsx (part 5 of 5)

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/course-attendance-report.md, docs/audit/gap2/lane-19/attendance-present-absent-button.md, docs/audit/gap2/lane-2/attendance-bulk-controller.md

## G2-18-009-087  [P3] GAP  facet F18  effort S
- Legacy: Legacy teacher header `Monthly class health` and `Monthly Attendance` grid (`TeacherAttendanceView.jsx:190-213`).
- vNext now: New header h2 `Monthly Attendance` for percentage and overall PageHeader Attendance (`faculty-attendance-workspace.tsx:581-595`).
- Fix: Restore primary metric label `Monthly class health` and grid separate title.

## G2-19-009-045  [P3] GAP  facet F17  effort S
- Legacy: Old icon decorative aria-hidden, visible P and A `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AbsentPresntBtnCol.js:23-36`
- vNext now: vNext full text and no icon `src/components/attendance/faculty-attendance-workspace.tsx:975-998`
- Fix: Restore decorative icons without reducing accessible label.

## G2-19-009-048  [P3] GAP  facet F18  effort S
- Legacy: Old surrounding status Ready to mark `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:293-297`
- vNext now: vNext Attendance not submitted yet copy `src/components/attendance/faculty-attendance-workspace.tsx:862-867`
- Fix: Match status badge copy where eligibility allows.

## G2-2-027-010  [P3] GAP  facet F03  effort S
- Legacy: TakeAttendance.js:310-315 labels `Students`, `Present`, `Absent` with bold counts.
- vNext now: faculty-attendance-workspace.tsx:1025-1034 shows `<N> absent · <N> present`, no overall count adjacent.
- Fix: Keep exact summary labels, count order and bold emphasis.

## G2-2-027-011  [P3] GAP  facet F03  effort S
- Legacy: TakeAttendance.js:318-324 search prefix icon SearchOutlined with allowClear.
- vNext now: faculty-attendance-workspace.tsx:873-881 uses Input with matching placeholder but no icon/explicit clear control.
- Fix: Add search icon prefix and clear affordance.

## G2-2-027-058  [P3] GAP  facet F13  effort S
- Legacy: TakeAttendance.js:365-372 empty says `No class scheduled for this date` and Schedule Class button.
- vNext now: faculty-attendance-workspace.tsx:802-805 EmptyState shares title with description, button at heading :494-502.
- Fix: Restore in-empty-state Schedule Class CTA location alongside persistent toolbar CTA.

## G2-2-027-073  [P3] GAP  facet F18  effort S
- Legacy: AttendanceBulkController.java:98 error `Nothing to record — provide at least one absent or present learner`.
- vNext now: faculty-attendance-workspace.tsx:360-361 says `Change at least one recorded mark before submitting a correction.`
- Fix: Differentiate first-time empty roster and already-saved no-change with exact copy.

## G2-2-027-074  [P3] GAP  facet F18  effort S
- Legacy: AttendanceBulkController.java:174-176 success `Attendance recorded for N learner(s)` and partial error.
- vNext now: faculty-attendance-workspace.tsx:429-435 success `Attendance marked successfully.` and uncertain-save warning.
- Fix: Restore numeric success detail if desired; mark atomic change explicitly in copy.

## G2-2-027-075  [P3] GAP  facet F18  effort S
- Legacy: TakeAttendance.js:279-300 `Attendance Session`, `Ready to mark`, `Schedule Class`.
- vNext now: faculty-attendance-workspace.tsx:844-867 shows session title, time and new recorded-state guidance.
- Fix: Restore exact heading and status chip while keeping new eligibility explanation.

## G2-2-027-088  [P3] GAP  facet F21  effort S
- Legacy: TakeAttendance.js:6-17 uses Redux, antd, dayjs, next/router and attendanceServices.
- vNext now: faculty-attendance-workspace.tsx:401-418 uses fetch JSON, Router refresh, shared UI components.
- Fix: Map integration-specific navigation and toast lifetimes without resurrecting Redux.
