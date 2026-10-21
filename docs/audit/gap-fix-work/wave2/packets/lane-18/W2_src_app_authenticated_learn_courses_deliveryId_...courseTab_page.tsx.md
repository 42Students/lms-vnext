# Work packet (wave 2): edit src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx

29 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/course-attendance.md, docs/audit/gap2/lane-16/u008-learner-syllabus.md, docs/audit/gap2/lane-17/learner-courses-courseid-catchall.md, docs/audit/gap2/lane-2/client-settings-controller.md, docs/audit/gap2/lane-3/l15-u031-learning-flow-cross-cutting.md, docs/audit/gap2/lane-8/shared-course-home.md

## G2-13-009-003  [P2] GAP  facet F01  effort M
- Legacy: Legacy class switch updates ?cls shallowly, retains selected class (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:30-41`)
- vNext now: New deliveryId route scopes selection, no class selector in learner view (`src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:32-45`)
- Fix: Map cls legacy deep links to correct delivery, preserve selected section.

## G2-13-009-004  [P2] GAP  facet F02  effort S
- Legacy: Legacy Attendance outer wrapper learn-projects-detail body/content (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/attendance.js:8-15`)
- vNext now: New attendance content in max width page with shared PageHeader/CourseTabs (`src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:162-180`)
- Fix: Match single content-card and tab canvas geometry.

## G2-13-009-041  [P2] GAP  facet F10  effort M
- Legacy: Legacy learner GET getStudentAttendanceListByDaterange with dates, courseSlug/Id, learnerId (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/StudentAttendanceView.jsx:19-37`)
- vNext now: New server getLearnerAttendanceWorkspace with deliveryId/IST window (`src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:136-145`)
- Fix: Crosswalk IDs and UTC/IST inclusive date semantics.

## G2-16-008-001  [P2] GAP  facet F01  effort M
- Legacy: `syllabus.js:378-381`: component uses `contentMode=roadmap` and title `Learning Path`.
- vNext now: `src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:125-135,172-179`: route `roadmap` uses LearnerCourseWorkspace with PageHeader `Course workspace`.
- Fix: Restore Learning Path page header hierarchy and old course tab canvas.

## G2-17-006-002  [P2] GAP  facet F01  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/courses/[courseId]/[...courseTab].js:101-108 invalid tab redirects to /home, preserving complete raw query.
- vNext now: src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:44-55 invalid or multi-segment tab redirects /home after capping 20 params, 100-char keys/500-char values.
- Fix: Match query preservation or document abuse-safe cap; test repeated parameters and hashes.

## G2-17-006-004  [P2] GAP  facet F02  effort 
- Legacy: docs/legacy-source/frontend/src/layouts/CourseTabsLayout.js:55-70 renders PageShell title, subtitle, back button and tab strip inside scroll-container.
- vNext now: src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:162-199 renders separate nav Back, PageHeader, banner, tabs and options disclosure.
- Fix: Conform to legacy PageShell nesting, spacing, header title and tab location.

## G2-17-006-006  [P2] GAP  facet F02  effort 
- Legacy: docs/legacy-source/frontend/src/layouts/CourseTabsLayout.js:55 selector changes outer CSS learn-course-layout--activeTab and contentClass learn-course-tab-page.
- vNext now: src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:163 uses one space-y-4 container for all tabs with no tab-specific outer CSS.
- Fix: Mirror tab-specific canvas classes and grid padding for header/content across four views.

## G2-17-006-011  [P2] GAP  facet F04  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/courses/[courseId]/[...courseTab].js:80-89 stores course name fallback course_name/courseName/name/'Unnamed Course'.
- vNext now: src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:68-73 joins learner deliveries to workspace.course.name, renders raw title at :172.
- Fix: Preserve legacy fallback for missing course title (if permitted by normalized schema).

## G2-17-006-026  [P2] GAP  facet F10  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/courses/[courseId]/[...courseTab].js:60-65 dynamic API getCourseBySlug/getCourse through docs/legacy-source/frontend/src/utils/learnerCourseDetail.js:8-12 after Redux clear.
- vNext now: src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:59-66 awaits getLearnerCourseWorkspace,listDeliveries,listInstructors concurrently server-side.
- Fix: Compare initial request budget and payload; avoid fetching all deliveries/instructors when tab does not require them.

## G2-17-006-036  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/learn/courses/[courseId]/[...courseTab].js:41-47 signed-out falls to course error alert.
- vNext now: src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:58-60 obtains server request context and throws on auth.
- Fix: Specify signed-out handling and navigate to login/your courses with exact recovery action.

## G2-17-006-039  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/layouts/CourseTabsLayout.js:55-70 scroll-container learn-projects learn-course-layout and PageShell responsive layout.
- vNext now: src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:163-199 generic min-w-0 max-w-full space-y-4, tab/nav under separate wrappers.
- Fix: Clone legacy breakpoint CSS margins, wrapping and mobile scroll/tabs.

## G2-17-006-040  [P2] GAP  facet F16  effort 
- Legacy: docs/legacy-source/frontend/src/layouts/CourseTabsLayout.js:55 changes outer class per tab, allowing syllabus/classroom/attendance-specific responsive overrides.
- vNext now: src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:163 no active-tab class, relies on child responsive components.
- Fix: Apply same per-tab canvas class for CSS parity where relevant.

## G2-17-006-044  [P2] GAP  facet F18  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/courses/[courseId]/[...courseTab].js:124-129 'Could not load course', 'Course unavailable', 'Try again'.
- vNext now: src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:173-175 read-only banner 'Past semester course · Read only. Submitted work remains accessible.'.
- Fix: Do not substitute historical notice for unpublished/error message; map state to exact copy.

## G2-17-006-046  [P2] GAP  facet F19  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/courses/[courseId]/[...courseTab].js:60-65 one getCourse endpoint plus class-scope hook, selected tab mounts own data.
- vNext now: src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:59-66 launches 3 base services each render, plus tab-specific announcement/display/attendance at :84-159.
- Fix: Profile redundant multi-join reads on every tab/filter change and cache scoped course meta.

## G2-17-006-053  [P2] GAP  facet F23  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/courses/[courseId]/[...courseTab].js:113-115 explicit resets Roadmap/Discussion on course switch, :101-108 unknown-tab redirect.
- vNext now: src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:158 keys Discussion, :45-55 strict invalid-tab recovery; Roadmap focus query supported.
- Fix: Verify learner Roadmap modal reset and preserve account switching lifetime.

## G2-2-035-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:24-28 endpoint is explicitly reachable by any signed-in user
- vNext now: src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:156-159 settings passed only when course discussion tab renders
- Fix: Expose same settings in progress/player and other relevant surfaces, not just discussion route.

## G2-2-035-024  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:44-57 one GET with three values
- vNext now: src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:156-159 pulls setting from SQL server component, not HTTP client fetch
- Fix: Make settings available to client video/progress and chat on initial payload or safe route.

## G2-2-035-034  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientSettingsController.java:44-57 read-only settings, no empty state in browser
- vNext now: src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:156-159 read before render; fails page if query throws
- Fix: Provide fault-tolerant loading/errors for discussion/player when settings unavailable.

## G2-15-031-038  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:104-109`
- vNext now: `src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:76-80`
- Fix: Old course switch clears stale attendance vs RSC delivery scope loading.

## G2-15-031-040  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/learn/courses/[courseId]/[...courseTab].js:121-130`
- vNext now: `src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:42-80`
- Fix: Old inline Try again and Back to courses vs server route notFound/redirect.

## G2-8-009-001  [P2] GAP  facet F01  effort M
- Legacy: shared course Home component rendered according to Redux userType FACULTY (`docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:35-44`)
- vNext now: dedicated learner/home and teacher/home dynamic routes share no common page body (`src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:32-44; src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx:10-38`)
- Fix: Ensure route alias mapping and identical course tab selection across both roles

## G2-8-009-008  [P2] GAP  facet F03  effort S
- Legacy: legacy button disabled while courseIdentifier missing; title Loading course… (`docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:384-392`)
- vNext now: vNext component renders after valid delivery resolution; no disabled button state (`src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:58-74; src/components/courses/learner-course-overview.tsx:395-407`)
- Fix: Show comparable pending/unavailable action when course scope loading rather than rendering broken link

## G2-8-009-019  [P2] GAP  facet F06  effort M
- Legacy: legacy navigate to filtered roadmap/blueprint using ?filter=lectures/resources/assessments/live-sessions (`docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:140-166`)
- vNext now: vNext learner next links encode lesson/content, faculty route query filter uppercase normalizer (`src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:125-134; src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx:17-20`)
- Fix: Normalize legacy lowercase filter tokens and map live-sessions to LIVE for faculty

## G2-8-009-027  [P2] GAP  facet F10  effort M
- Legacy: legacy client getCourseBySlug or getCourse with AbortController on change (`docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:80-117`)
- vNext now: vNext SSR workspace by deliveryId + display read service; no client abort in page (`src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:58-90`)
- Fix: Map getCourse service response to new delivery read and validate switch races

## G2-8-009-035  [P2] GAP  facet F13  effort M
- Legacy: legacy course about skeleton aria-busy and sr-only Loading course overview (`docs/legacy-source/frontend/src/components/Course/Home/InThisCourseSection.jsx:50-64`)
- vNext now: new route uses Next loading component rather than in-card course about skeleton (`src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:84-101`)
- Fix: Restore subsection skeleton independent of full workspace loading

## G2-8-009-051  [P2] GAP  facet F22  effort M
- Legacy: legacy Redux course identifier/id plus API metadata fields (`docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:37-44,129-138`)
- vNext now: vNext course delivery UUID, courseOffering metadata, section and period, richer normalized model (`src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:58-123`)
- Fix: Provide read-model mapping and compatibility resolver for slug legacy URLs

## G2-8-009-054  [P2] GAP  facet F23  effort M
- Legacy: legacy class assignment pending state is explicit (`docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:485-491`)
- vNext now: vNext absence of delivery produces notFound, may remove diagnostic (`src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:58-74`)
- Fix: Retain actionable not-enrolled explanation instead of generic missing course

## G2-17-006-005  [P3] GAP  facet F02  effort 
- Legacy: docs/legacy-source/frontend/src/layouts/CourseTabsLayout.js:60-66 title fallback Course, subtitle Course workspace, back 'Back to courses'.
- vNext now: src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:165-172 title workspace.course.name, back copy from LEARNER_BACK_TO_COURSES, no fallback.
- Fix: Restore legacy title fallback and exact back-label casing where used.

## G2-17-006-041  [P3] GAP  facet F17  effort 
- Legacy: docs/legacy-source/frontend/src/layouts/CourseTabsLayout.js:62-66 PageShell ariaLabel 'Course workspace', tabsAriaLabel 'Course sections'.
- vNext now: src/components/courses/learner-course-tabs.tsx:19 ariaLabel 'Course workspace' not Course sections; src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:164 nav 'Course navigation'.
- Fix: Set tabs accessible label to 'Course sections' and preserve back nav semantics.
