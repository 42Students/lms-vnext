# Work packet: edit src/components/attendance/learner-attendance-workspace.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/course-attendance-report.md, docs/audit/gap2/lane-19/learner-attendance.md, docs/audit/gap2/lane-5/u027-learner-controller.md

## G2-18-009-035  [P1] GAP  facet F07  effort M
- Legacy: Legacy learner error `Failed to load attendance.` Alert plus Retry (`StudentAttendanceView.jsx:37-69`).
- vNext now: New SSR course/month loader does not show this in-page alert in workspace (`learn/attendance/page.tsx:19-25`; `learner-attendance-workspace.tsx:163-175`).
- Fix: Add attendance-scoped error state with exact legacy copy and Retry instead of route failure.

## G2-19-006-004  [P1] GAP  facet F02  effort L
- Legacy: Legacy PageShell/scroll-container + filter bar then one list card `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:339-374` `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:387-425`
- vNext now: vNext stacked border sections: Course/Month, Attendance Disclosure, Eligibility, Course overview, Session history `src/components/attendance/learner-attendance-workspace.tsx:275-564`
- Fix: Return direct Attendance list density and move enhanced analytics under optional disclosures.

## G2-19-006-045  [P1] GAP  facet F12  effort L
- Legacy: Legacy only Present/Absent explicit; absence array dominates and attendanceMarked false indicates missing `docs/legacy-source/frontend/src/utils/attendanceConstants.js:29-34`
- vNext now: vNext supports EXCUSED, MEDICAL, LATE, CANCELLED (?) in typed rows `src/components/attendance/learner-attendance-workspace.tsx:55-61` `src/components/attendance/learner-attendance-workspace.tsx:121-131`
- Fix: Reconcile status transition/provenance when moving from legacy absence list.

## G2-19-006-052  [P1] GAP  facet F13  effort M
- Legacy: Legacy courses failure vs zero enrollment distinct with Retry `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:375-385` `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:427-434`
- vNext now: vNext when courses.length=0 always No Courses to track yet `src/components/attendance/learner-attendance-workspace.tsx:266-273`
- Fix: Differentiate data fetch failure from genuine zero enrolled courses.

## G2-19-006-067  [P1] GAP  facet F18  effort M
- Legacy: Legacy empty error `Couldn't load your courses` and Retry `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:427-432`
- vNext now: vNext `No Courses to track yet` for no authorized courses `src/components/attendance/learner-attendance-workspace.tsx:266-273`
- Fix: Do not conflate 403/transport failure with no courses.

## G2-19-006-030  [P2] GAP  facet F07  effort M
- Legacy: Legacy attendance request failure shows `Something went wrong loading attendance for this month.` and Retry `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:286-298`
- vNext now: vNext server read no per-month retry/local load banner `src/app/(authenticated)/learn/attendance/page.tsx:19-26` `src/components/attendance/learner-attendance-workspace.tsx:531-535`
- Fix: Add explicit error/Retry distinct from empty session state.

## G2-19-006-033  [P2] GAP  facet F08  effort M
- Legacy: Legacy loading refresh `Updating attendance for MMMM YYYY…` `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:445-448`
- vNext now: vNext URL navigates and re-renders, no explicit updating banner `src/components/attendance/learner-attendance-workspace.tsx:219-246` `src/components/attendance/learner-attendance-workspace.tsx:494-537`
- Fix: Display in-place refresh status when month/course changes.

## G2-5-027-038  [P2] GAP  facet F08  effort M
- Legacy: Legacy attendance remove success `Absence removed`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:883-895`
- vNext now: vNext learner attendance workspace is read-only and shows status summaries. `src/components/attendance/learner-attendance-workspace.tsx:34-63`
- Fix: Locate faculty writer toast and preserve exact remove status.
