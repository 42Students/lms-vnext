# Work packet: edit src/components/courses/learner-course-attendance.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u009-learner-attendance.md, docs/audit/gap2/lane-13/course-attendance.md

## G2-16-009-008  [P1] MISSING  facet F03  effort S
- Legacy: StudentAttendanceView.jsx:60-68 error alert includes Retry button.
- vNext now: learner-course-attendance.tsx:198-205 missing course uses EmptyState, no retry.
- Fix: Add localized retriable load-error Alert.

## G2-16-009-016  [P1] GAP  facet F05  effort M
- Legacy: StudentAttendanceView.jsx:73-80 absentIds and learnerSessionStatus derive future/pending.
- vNext now: learner-course-attendance.tsx:363-366 uses normalized stored status.
- Fix: Reconcile future/unmarked/cancelled statuses vs legacy helper.

## G2-16-009-022  [P1] GAP  facet F07  effort S
- Legacy: StudentAttendanceView.jsx:42-49 failure text Failed to load attendance.
- vNext now: learner-course-attendance.tsx:198-205 treats no course as no attendance data.
- Fix: Catch real service failure independently and display exact text.

## G2-16-009-029  [P1] GAP  facet F10  effort M
- Legacy: StudentAttendanceView.jsx:37-49 independent attendance fetch/failure.
- vNext now: learner-course-attendance.tsx:139-198 depends on larger server workspace.
- Fix: Split local attendance recovery from entire course.

## G2-13-009-033  [P2] GAP  facet F07  effort S
- Legacy: Legacy missing selected course silently clears data (not malformed API) (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/StudentAttendanceView.jsx:30-34`)
- vNext now: New delivery scope not found returns EmptyState No attendance data (`src/components/courses/learner-course-attendance.tsx:198-204`)
- Fix: Differentiate no course selection vs empty schedule.

## G2-16-009-023  [P2] MISSING  facet F07  effort S
- Legacy: StudentAttendanceView.jsx:60-68 Retry increments count for same month.
- vNext now: learner-course-attendance.tsx:341-373 no retry on failed data read.
- Fix: Add same-month re-fetch.

## G2-16-009-024  [P2] GAP  facet F07  effort S
- Legacy: StudentAttendanceView.jsx:89-91 threshold fallback ATTENDANCE_THRESHOLD.
- vNext now: learner-course-attendance.tsx:207-235 invalid policy may poison headroom.
- Fix: Validate and provide old threshold fallback.

## G2-16-009-025  [P3] GAP  facet F08  effort S
- Legacy: StudentAttendanceView.jsx:60-68 error is inline Ant Alert, not toast.
- vNext now: learner-course-attendance.tsx:198-205 missing record uses EmptyState.
- Fix: Preserve retryable inline alert.

## G2-16-009-026  [P3] GAP  facet F08  effort S
- Legacy: StudentAttendanceView.jsx:98-110 contextual safe/risk guidance in primary card.
- vNext now: learner-course-attendance.tsx:216-236 equivalent guidance, changed sentence copy.
- Fix: Use exact legacy threshold sentences.
