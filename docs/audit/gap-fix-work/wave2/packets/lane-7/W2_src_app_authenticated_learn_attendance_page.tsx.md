# Work packet (wave 2): edit src/app/(authenticated)/learn/attendance/page.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/course-attendance-report.md, docs/audit/gap2/lane-19/learner-attendance.md, docs/audit/gap2/lane-3/l15-u031-learning-flow-cross-cutting.md

## G2-18-009-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy shared AttendanceReport mounted inside selected Course Attendance tab, conditional on FACULTY/ADMIN/SUPER_ADMIN vs learner (`AttendanceReport.js:12-20,44-99`).
- vNext now: New learner standalone `/learn/attendance`; faculty separate `FacultyAttendanceWorkspace` in course detail (`learn/attendance/page.tsx:13-36`; `faculty-attendance-workspace.tsx:141-153`).
- Fix: Preserve nested course-tab entry with role-specific viewer and correct active tab.

## G2-18-009-069  [P2] GAP  facet F13  effort M
- Legacy: Legacy report loading Spin and distinct failures/no data (`TeacherAttendanceView.jsx:112-140`; `StudentAttendanceView.jsx:53-69`).
- vNext now: New SSR initial load and local month filter no scoped loading Spinner (`faculty-attendance-workspace.tsx:290-302,494-579`; `learn/attendance/page.tsx:19-25`).
- Fix: Add local loading skeleton/spinner when switching course/month.

## G2-19-006-001  [P2] GAP  facet F01  effort S
- Legacy: Legacy `/learn/attendance` renders AttendanceContent without route-level metrics `docs/legacy-source/frontend/src/pages/learn/attendance.js:1-7`
- vNext now: vNext same URL renders PageHeader, calendar backlink and Workspace `src/app/(authenticated)/learn/attendance/page.tsx:27-56`
- Fix: Match initial navigation hierarchy and place calendar link without displacing metrics.

## G2-19-006-003  [P2] GAP  facet F01  effort M
- Legacy: Legacy Attendance in PageShell/ListingPageHeader with compact metric pills `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:342-374`
- vNext now: vNext PageHeader plus separate learner workspace metrics under Disclosure `src/app/(authenticated)/learn/attendance/page.tsx:27-36` `src/components/attendance/learner-attendance-workspace.tsx:366-401`
- Fix: Restore old header/metrics visual hierarchy and compact pills.

## G2-19-006-049  [P2] GAP  facet F13  effort M
- Legacy: Legacy 5x5 TableSkeleton before first records fetch `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:435-439`
- vNext now: vNext server data read before client workspace, no matching table skeleton inside `src/app/(authenticated)/learn/attendance/page.tsx:19-36`
- Fix: Add attendance table skeleton with same 5 rows while loading.

## G2-19-006-057  [P2] GAP  facet F15  effort S
- Legacy: Legacy API error toast bottomRight 5 seconds `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:127-139`
- vNext now: vNext server no equivalent toast for enrollment load `src/app/(authenticated)/learn/attendance/page.tsx:19-26`
- Fix: Restore localized error notification, not email.

## G2-19-006-068  [P2] GAP  facet F19  effort M
- Legacy: Legacy loads one month of selected course only `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:146-177`
- vNext now: vNext workspace initially queries all authorized deliveries for month then client filters by delivery `src/app/(authenticated)/learn/attendance/page.tsx:21-25` `src/modules/attendance/learner-service.ts:128-245`
- Fix: Benchmark many deliveries and only request selected-month course where appropriate.

## G2-15-031-009  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:74-96`
- vNext now: `src/app/(authenticated)/learn/attendance/page.tsx:27-38`
- Fix: Legacy Student Name/Status attendance table and counters vs new monthly learner attendance.

## G2-15-031-013  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:112-146`
- vNext now: `src/app/(authenticated)/learn/attendance/page.tsx:17-26`
- Fix: Legacy per class schedule/day roster vs IST monthly delivery record window.

## G2-15-031-052  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:74-87`
- vNext now: `src/app/(authenticated)/learn/attendance/page.tsx:27-38`
- Fix: Old Student Name/Status label layout differs.

## G2-18-009-003  [P3] GAP  facet F01  effort S
- Legacy: Legacy learner subtitle `See your attendance record and class-wise status in one place.` (`AttendanceReport.js:44-57`).
- vNext now: New PageHeader title `Attendance`, no matching subtitle (`learn/attendance/page.tsx:27-35`).
- Fix: Render exact learner subtitle under course Attendance tab.
