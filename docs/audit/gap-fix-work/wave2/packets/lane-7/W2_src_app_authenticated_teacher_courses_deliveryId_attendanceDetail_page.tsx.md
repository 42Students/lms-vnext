# Work packet (wave 2): edit src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u009-teacher-attendance-view.md, docs/audit/gap2/lane-15/take-attendance.md, docs/audit/gap2/lane-18/u001-faculty-course-tab.md

## G2-14-009-001  [P2] GAP  facet F01  effort M
- Legacy: Role-specific AttendanceReport mounts this faculty report component in course tab `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:14-19` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:94-99`
- vNext now: Standalone course delivery attendanceDetail route with visible PageHeader `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx:14-39` `src/components/attendance/faculty-attendance-workspace.tsx:498-506`
- Fix: Keep attendance report in a unified course tab with no duplicate page head

## G2-14-009-002  [P2] GAP  facet F01  effort M
- Legacy: Faculty with multiple class assignments selects class in toolbar and URL changes shallowly via cls `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:30-41` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:60-73`
- vNext now: cls redirects to delivery route and class select is absent `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx:24-34` `src/components/attendance/faculty-attendance-workspace.tsx:498-520`
- Fix: Show class selector only for multiple assignments and preserve cls deep link

## G2-14-009-028  [P2] MISSING  facet F06  effort M
- Legacy: Class selector shows only when more than one assignment, width min 160px `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:60-72`
- vNext now: No in-page class selector `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx:24-34` `src/components/attendance/faculty-attendance-workspace.tsx:498-520`
- Fix: Add class selector with same conditional and placeholder

## G2-14-009-041  [P2] GAP  facet F10  effort M
- Legacy: GET filtered class schedules endpoint takes classId course slug/id facultyId start/end `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:53-67` `docs/legacy-source/frontend/src/api/serviceUrl.js:127-128`
- vNext now: Server reads delivery scoped sessions and records via Drizzle `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx:35-65` `src/modules/attendance/faculty-service.ts:225-368`
- Fix: Document field mapping and date-scope adapter

## G2-14-009-053  [P2] GAP  facet F13  effort S
- Legacy: Loading shows centered large spinner `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:115-121` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:135-141`
- vNext now: Server route blocks render until workspace fetched `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx:35-40`
- Fix: Provide suspense loading matching spinner

## G2-15-009-001  [P2] GAP  facet F01  effort M
- Legacy: Course tab in shared old course shell; segmented switch changes view in place (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:44-98`)
- vNext now: Dedicated /teacher/courses/[deliveryId]/attendanceDetail page with own nav (`src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx:75-95`)
- Fix: Keep legacy in-course tab shell, selected tab and navigation hierarchy

## G2-15-009-059  [P2] GAP  facet F13  effort M
- Legacy: Loading Spin, error Could not load the attendance roster with Retry (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:264-275`)
- vNext now: Page-level async data load; no matching in-panel retry (`src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx:35-39`)
- Fix: Add explicit spinner/Error/Retry states

## G2-18-001-012  [P2] GAP  facet F02  effort M
- Legacy: Legacy Attendance tab subtitle, class selector + segmented report/mark controls + mode filters before grid. `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:45-102`
- vNext now: vNext adds back and session-coverage nav, schedule editor Disclosure around new attendance workspace. `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx:75-109`
- Fix: Reconcile the legacy toolbar order and mode control labels; relocate optional advanced tools.

## G2-18-001-095  [P2] GAP  facet F20  effort S
- Legacy: Legacy numeric `?cls` unauthorized candidate falls back to safe assigned class and rewrites URL. `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:67-82`
- vNext now: vNext `?cls` on roster/attendance returns 404 if not in authorized deliveries. `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx:17-25`, `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx:24-34`
- Fix: Choose desired compatibility fallback vs explicit 404; document exact expected UX.
