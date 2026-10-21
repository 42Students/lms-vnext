# Work packet: edit src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u009-teacher-attendance-view.md, docs/audit/gap2/lane-15/take-attendance.md, docs/audit/gap2/lane-18/u001-faculty-course-tab.md

## G2-14-009-030  [P1] GAP  facet F07  effort M
- Legacy: Fetch failure says Couldn't load attendance data for this month. and offers Retry `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:122-128`
- vNext now: Server loader has no month-local retry state `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx:35-40` `src/components/attendance/faculty-attendance-workspace.tsx:494-522`
- Fix: Catch server fetch failure and show exact Retry state

## G2-15-009-002  [P1] GAP  facet F01  effort M
- Legacy: Multi-class faculty selector uses classId and shallow ?cls navigation (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:60-73`)
- vNext now: Supports ?cls redirect but lacks equivalent visible class selector (`src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx:24-33`)
- Fix: Add multi-section class switcher and preserve dirty draft + deep-link session

## G2-15-009-033  [P1] GAP  facet F07  effort M
- Legacy: API load error shown or Failed to load students or attendance. (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:153-161`)
- vNext now: Async server fetch with no mark-specific load error/retry UI (`src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx:35-39`)
- Fix: Add scoped roster error state and Retry with old fallback wording

## G2-18-001-004  [P1] GAP  facet F01  effort M
- Legacy: `?cls=<numeric-class-id>` selects authorized class and canonicalizes a stale class selection. `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:67-82`, `docs/legacy-source/frontend/src/utils/facultyCourseDetail.js:23-47`
- vNext now: Section selector uses delivery UUID; students/attendance accept `cls` only when it matches section or delivery UUID, not legacy numeric class ID. `src/components/courses/faculty-course-tab-navigation.tsx:53-66`, `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx:17-26`, `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx:24-34`
- Fix: Introduce legacy numeric-class map with tenant/teacher authorization and redirect; do not silently show an unrelated section.

## G2-14-009-031  [P2] GAP  facet F07  effort S
- Legacy: Missing class or course scope resets data without GET `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:43-65` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:89-99`
- vNext now: Missing delivery or cls target redirects/notFound `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx:24-39`
- Fix: Distinguish valid missing course selection and authorization failure
