# Work packet (wave 2): edit src/components/courses/faculty-course-tab-navigation.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u001-faculty-course-tab.md

## G2-18-001-006  [P2] GAP  facet F01  effort S
- Legacy: Legacy canvas Back to courses right action at top in PageShell. `docs/legacy-source/frontend/src/layouts/CourseTabsLayout.js:59-67`
- vNext now: vNext Back to courses appears as left PageBackLink, plus extra author action nav on right. `src/components/courses/faculty-course-tab-navigation.tsx:44-82`
- Fix: Place Back to courses in legacy page-head action position; move new shortcuts to secondary tools region if retained.

## G2-18-001-008  [P2] GAP  facet F02  effort M
- Legacy: Single CourseTabsLayout PageShell with main course title, `Course workspace` subtitle, tabs, then content. `docs/legacy-source/frontend/src/layouts/CourseTabsLayout.js:54-70`, `docs/legacy-source/frontend/src/components/Common/PageShell.jsx:50-88`
- vNext now: Shared layout displays back, text `course · section`, 3 action links, tabs, then child pages render their own PageHeader. `src/app/(authenticated)/teacher/courses/[deliveryId]/layout.tsx:26-35`, `src/components/courses/faculty-course-tab-navigation.tsx:44-89`, `src/components/courses/faculty-course-workspace.tsx:385-420`
- Fix: Use one consistent canvas and shared PageHeader with legacy title/subtitle once, suppress nested headers.

## G2-18-001-034  [P2] GAP  facet F06  effort S
- Legacy: Legacy class selection is a 160px dropdown shown if more than one assignment, placeholder `Select Class`. `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:351-365`, `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:60-72`
- vNext now: vNext Teaching Section selector is full-width up to 18rem with label, present at all course tabs. `src/components/courses/faculty-course-tab-navigation.tsx:53-67`
- Fix: Use legacy select width, per-tab placement and label on Students/Attendance while preserving delivery routing.

## G2-18-001-061  [P2] GAP  facet F12  effort M
- Legacy: Legacy class selection priority query cls > numeric mapping class > stored class > lowest classId. `docs/legacy-source/frontend/src/utils/facultyCourseDetail.js:23-47`
- vNext now: vNext identifies a precise deliveryId in route, separate selector changes delivery. `src/app/(authenticated)/teacher/courses/[deliveryId]/layout.tsx:13-25`, `src/components/courses/faculty-course-tab-navigation.tsx:53-65`
- Fix: When translating old links respect legacy priority; avoid choosing arbitrary section for ambiguous course.

## G2-18-001-098  [P2] GAP  facet F21  effort M
- Legacy: Legacy assignment/class/course endpoints use Spring services; frontend polls teaching authorization. `docs/legacy-source/frontend/src/api/Services/FacultyAssignmentService.js:30-33`, `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:137-203`
- vNext now: vNext reads PostgreSQL via Drizzle on server and refreshes route state. `src/modules/courses/faculty-course-service.ts:60-202`, `src/components/courses/faculty-course-tab-navigation.tsx:29-42`
- Fix: Record integration switch explicitly; provide compatibility only for old deep links and downstream callbacks.

## G2-18-001-083  [P3] GAP  facet F17  effort S
- Legacy: Legacy class select aria-label `Select class to view its roster` in Students. `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:351-365`
- vNext now: vNext selector label `Teaching Section` outside the Students panel. `src/components/courses/faculty-course-tab-navigation.tsx:53-67`
- Fix: Use context-specific accessible name matching current destination.
