# Work packet (wave 2): edit src/components/courses/learner-course-attendance.tsx (part 2 of 2)

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u009-learner-attendance.md

## G2-16-009-033  [P3] GAP  facet F12  effort S
- Legacy: StudentAttendanceView.jsx:107-109 below-threshold recoverable/nonrecoverable branches.
- vNext now: learner-course-attendance.tsx:228-235 equivalent math but different copy.
- Fix: Match requirement phrasing.

## G2-16-009-036  [P3] GAP  facet F13  effort S
- Legacy: StudentAttendanceView.jsx:135-151 empty text No classes in this period.
- vNext now: learner-course-attendance.tsx:341-345 same title plus extra description.
- Fix: Match Ant Empty simple icon and no extra description.

## G2-16-009-042  [P3] GAP  facet F17  effort S
- Legacy: StudentAttendanceView.jsx:98 aria-label Student attendance summary.
- vNext now: learner-course-attendance.tsx:325 aria-label Attendance this month.
- Fix: Match accessible region label.

## G2-16-009-043  [P3] GAP  facet F17  effort S
- Legacy: StudentAttendanceView.jsx:128-143 Ant table four accessible column titles.
- vNext now: learner-course-attendance.tsx:347-371 caption and five columns.
- Fix: Restore column labels, retain caption.

## G2-16-009-045  [P3] GAP  facet F18  effort S
- Legacy: StudentAttendanceView.jsx:100-106 says You need N%. You can miss N more classes this month.
- vNext now: learner-course-attendance.tsx:223-227 says remain at or above current threshold.
- Fix: Match this month phrase and exact helper.

## G2-16-009-046  [P3] GAP  facet F18  effort S
- Legacy: StudentAttendanceView.jsx:107-109 says Below the N% requirement and Talk to your faculty.
- vNext now: learner-course-attendance.tsx:232-235 says threshold and Faculty or College team.
- Fix: Restore legacy wording and case.

## G2-16-009-048  [P3] GAP  facet F18  effort S
- Legacy: StudentAttendanceView.jsx:209 Present/Absent column.
- vNext now: learner-course-attendance.tsx:363 Status column.
- Fix: Rename column.
