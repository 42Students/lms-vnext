# Work packet (wave 2): edit src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/course-attendance.md, docs/audit/gap2/lane-17/teacher-courses-courseid-index.md, docs/audit/gap2/lane-18/u001-faculty-course-tab.md, docs/audit/gap2/lane-3/l15-u031-learning-flow-cross-cutting.md, docs/audit/gap2/lane-8/shared-course-home.md

## G2-13-009-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy same AttendanceReport detects FACULTY/ADMIN role, toggles report/mark (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:14-22`)
- vNext now: New separate faculty attendance workspace and learner route; faculty course catchall only home/blueprint (`src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx:20-42`)
- Fix: Keep one accessible Attendance tab destination for faculty/admin or canonical redirect.

## G2-17-001-020  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/index.js:13 calls router.replace without API or DB write; docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:89-121 loads course and faculty assignments downstream.
- vNext now: src/app/(authenticated)/teacher/courses/[deliveryId]/page.tsx:11 redirects without DB call; src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx:25-41 loads scoped workspace and signals via server services.
- Fix: Document the redirect/bootstrap boundary and verify that destination opens only after current teaching assignment is verified.

## G2-18-001-005  [P2] GAP  facet F01  effort S
- Legacy: Invalid tab redirects to home while preserving existing query string. `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:208-215`
- vNext now: Catch-all redirects home without retaining filter, lesson, cls, or extra query. `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx:21-23`
- Fix: Construct sanitized `home` target preserving allowed query params.

## G2-15-031-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:19-30`
- vNext now: `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx:16-25`
- Fix: Legacy slug/numeric course + class context vs vNext delivery UUID and scoped assignment.

## G2-15-031-003  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:19-19`
- vNext now: `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx:21-25`
- Fix: Five faculty legacy tabs routed together; vNext catchall accepts home/blueprint only, others have dedicated routes.

## G2-15-031-055  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:33-60`
- vNext now: `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx:25-31`
- Fix: Old client Redux boot and course switch vs new SSR version/scope.

## G2-8-009-001  [P2] GAP  facet F01  effort M
- Legacy: shared course Home component rendered according to Redux userType FACULTY (`docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:35-44`)
- vNext now: dedicated learner/home and teacher/home dynamic routes share no common page body (`src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:32-44; src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx:10-38`)
- Fix: Ensure route alias mapping and identical course tab selection across both roles

## G2-8-009-019  [P2] GAP  facet F06  effort M
- Legacy: legacy navigate to filtered roadmap/blueprint using ?filter=lectures/resources/assessments/live-sessions (`docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:140-166`)
- vNext now: vNext learner next links encode lesson/content, faculty route query filter uppercase normalizer (`src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:125-134; src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx:17-20`)
- Fix: Normalize legacy lowercase filter tokens and map live-sessions to LIVE for faculty

## G2-8-009-030  [P2] GAP  facet F11  effort M
- Legacy: legacy faculty route prefix determined by facultyType and router path (`docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:146-165`)
- vNext now: new faculty base routes /teacher/courses/... independent of subtype (`src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx:16-22`)
- Fix: Map legacy sub-role faculty URLs onto teacher routes with safe aliases

## G2-17-001-021  [P3] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:34-38 clears Redux selected lesson/course/assignments before bootstrap; :116-123 sets selectedCourse and class.
- vNext now: src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx:25-41 resolves server-side scoped workspace; no Redux course bootstrap.
- Fix: Check downstream legacy callers for stale Redux state assumptions; keep authorization authoritative, avoid carrying old course state.
