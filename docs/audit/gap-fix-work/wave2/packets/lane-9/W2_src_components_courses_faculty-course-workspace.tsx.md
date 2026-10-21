# Work packet (wave 2): edit src/components/courses/faculty-course-workspace.tsx

21 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/legacy-resource-viewer.md, docs/audit/gap2/lane-17/teacher-courses-courseid-index.md, docs/audit/gap2/lane-18/u001-faculty-course-tab.md, docs/audit/gap2/lane-3/l15-u031-learning-flow-cross-cutting.md

## G2-17-008-009  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:130-138 — Faculty header shows edit and remove icon actions.
- vNext now: src/components/courses/faculty-course-workspace.tsx:148-162 — FacultyContentEditor and generic actions, no matching paired icons.
- Fix: Match edit/remove icon action placement and labels.

## G2-17-001-006  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/layouts/CourseTabsLayout.js:52-77 wraps destination in PageShell title/subtitle/actions/tabs.
- vNext now: src/components/courses/faculty-course-workspace.tsx:384-414 renders PageHeader, overview actions and navigation on destination.
- Fix: Match legacy shell grouping and heading/action placement, without changing vNext content sections.

## G2-17-001-010  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/layouts/CourseTabsLayout.js:34-36 chooses selectedCourse.name/course_name/courseName after matching the route; fallback 'Course' at :62.
- vNext now: src/components/courses/faculty-course-workspace.tsx:384-387 uses course.courseName and description of code, section and academic period.
- Fix: Reconcile title fallback and supplementary metadata formatting with legacy PageShell; preserve useful vNext detail separately.

## G2-17-001-035  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/layouts/CourseTabsLayout.js:60-65 says 'Course', 'Course workspace', 'Back to courses'; docs/legacy-source/frontend/src/components/Course/Common/CourseTabSkeleton.jsx:170 says 'Loading course'.
- vNext now: src/components/courses/faculty-course-workspace.tsx:384-387 names actual course with code/section/period; src/app/(authenticated)/teacher/courses/[deliveryId]/loading.tsx:4 says 'Loading Faculty course…'.
- Fix: Use legacy copy for shell/loading labels or document product-approved exceptions; compare old copy catalogue course page closure.

## G2-18-001-008  [P2] GAP  facet F02  effort M
- Legacy: Single CourseTabsLayout PageShell with main course title, `Course workspace` subtitle, tabs, then content. `docs/legacy-source/frontend/src/layouts/CourseTabsLayout.js:54-70`, `docs/legacy-source/frontend/src/components/Common/PageShell.jsx:50-88`
- vNext now: Shared layout displays back, text `course · section`, 3 action links, tabs, then child pages render their own PageHeader. `src/app/(authenticated)/teacher/courses/[deliveryId]/layout.tsx:26-35`, `src/components/courses/faculty-course-tab-navigation.tsx:44-89`, `src/components/courses/faculty-course-workspace.tsx:385-420`
- Fix: Use one consistent canvas and shared PageHeader with legacy title/subtitle once, suppress nested headers.

## G2-18-001-009  [P2] GAP  facet F02  effort M
- Legacy: Home order: optional course-about card, Next action, warning, Pending work, course activity. `docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:323-429`, `docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:460-500`
- vNext now: vNext renders faculty signals first, credits/instructor, read-only description, teaching class details, five metric tiles. `src/components/courses/faculty-course-workspace.tsx:423-490`, `src/components/courses/faculty-course-home-signals.tsx:36-140`
- Fix: Restore legacy section hierarchy/order; place vNext-only modules behind secondary section if retained.

## G2-18-001-010  [P2] GAP  facet F02  effort M
- Legacy: Blueprint consists of roadmap filters, numbered expandable lesson rows, contents, top Add content dropdown. `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:937-1042`
- vNext now: vNext displays learning-path heading/status, filters, Disclosure rows, `View lesson details`, per-lesson authoring/video/order editors. `src/components/courses/faculty-course-workspace.tsx:492-699`
- Fix: Match legacy roadmap density, numbered row/pill/filter/creation placement while retaining existing services.

## G2-18-001-018  [P2] GAP  facet F03  effort M
- Legacy: Legacy Blueprint lesson action is one icon+text Add content dropdown with 5 typed entries. `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:51-57`, `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:1019-1038`
- vNext now: vNext renders FacultyLessonAuthoring and VideoManager and ContentOrderEditor within each lesson instead. `src/components/courses/faculty-course-workspace.tsx:632-662`
- Fix: Expose the same five names in a single first-position menu; route choice to existing creation editors.

## G2-18-001-019  [P2] GAP  facet F03  effort M
- Legacy: Legacy resource/video/quiz/assignment/live rows use type icon, title, due/relative live caption and state chips. `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:1042-1110`
- vNext now: vNext inline content cards show type/status/audience badges, title, points, order sequence, notes. `src/components/courses/faculty-course-workspace.tsx:104-173`
- Fix: Show legacy icon+status/date row density; preserve actions without card-on-card.

## G2-18-001-026  [P2] GAP  facet F04  effort S
- Legacy: Legacy inline assessment rows show deadline/quiz state and live label under content title. `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:1052-1112`
- vNext now: vNext assessment cards show due with Intl en-IN medium/short, quiz max attempts/results status. `src/components/courses/faculty-course-workspace.tsx:177-260`, `src/components/courses/faculty-course-workspace.tsx:265-313`
- Fix: Specify exact date/time and state copy per type matching legacy UI for equivalent statuses.

## G2-18-001-050  [P2] GAP  facet F09  effort M
- Legacy: Legacy 5-type `Add content` menu triggers video/resources drawer, assignment drawer and quiz-builder modal. `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:1019-1038`, `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:1210-1233`
- vNext now: vNext authoring controls are distinct component flows. `src/components/courses/faculty-course-workspace.tsx:632-651`
- Fix: Group existing workflows behind Add content dropdown and preserve each cancel/save-result behavior.

## G2-18-001-055  [P2] GAP  facet F10  effort M
- Legacy: Legacy faculty lesson-content create POST `/api/v1/faculty/lesson-contents/create` with lesson/class IDs and active teaching assignment. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyLessonContentController.java:31-97`
- vNext now: vNext authoring uses delivery-specific `FacultyLessonAuthoring` and centralized workspace ownership. `src/components/courses/faculty-course-workspace.tsx:632-643`, `src/modules/courses/faculty-course-service.ts:204-247`
- Fix: Check payload/state transition parity on every type in dedicated content audit; map old lesson IDs securely.

## G2-18-001-063  [P2] GAP  facet F12  effort S
- Legacy: Legacy blueprint's draft quiz is labeled `Draft · hidden from students`. `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:1050-1093`
- vNext now: vNext status `DRAFT` is shown in a badge with `All classes/This class` audience. `src/components/courses/faculty-course-workspace.tsx:109-124`, `src/components/courses/faculty-course-workspace.tsx:265-289`
- Fix: Add exact hidden-from-students explanatory badge on draft quiz where policy holds.

## G2-18-001-068  [P2] GAP  facet F13  effort S
- Legacy: Legacy no lessons empty state tells faculty lessons are admin-managed. `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:59-83`, `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:903-916`
- vNext now: vNext has distinct `No current learning path` and `No lessons yet`; empty lessons says path no active lessons. `src/components/courses/faculty-course-workspace.tsx:492-500`, `src/components/courses/faculty-course-workspace.tsx:554-560`
- Fix: Display legacy no-lessons explanatory copy when path exists but zero active lessons; preserve separate genuinely missing path explanation.

## G2-18-001-082  [P2] GAP  facet F17  effort S
- Legacy: Legacy syllabus content list uses aria-pressed filters and aria-label describing locked/done/expired state. `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:940-950`, `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:1071-1080`
- vNext now: vNext uses Tabs with hrefs and Disclosure; status is text badges. `src/components/courses/faculty-course-workspace.tsx:518-529`, `src/components/courses/faculty-course-workspace.tsx:588-615`
- Fix: Give equivalent accessible state+content identity and keyboard-exposed filter selection.

## G2-18-001-084  [P2] GAP  facet F18  effort S
- Legacy: Legacy CourseTabsLayout subtitle is exactly `Course workspace`. `docs/legacy-source/frontend/src/layouts/CourseTabsLayout.js:59-64`
- vNext now: vNext page description is course code, section and term; eyebrow `Faculty · Course`. `src/components/courses/faculty-course-workspace.tsx:389-393`
- Fix: Restore subtitle on shell; relocate code/section metadata to secondary details.

## G2-18-001-085  [P2] GAP  facet F18  effort S
- Legacy: Legacy Blueprint content page sr-only title `Course Blueprint`. `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:59-83`, `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:880-888`
- vNext now: vNext Blueprint displays generic `Learning path` heading and title. `src/components/courses/faculty-course-workspace.tsx:503-513`
- Fix: Use Course Blueprint accessible title and preserve learning path title as subheading.

## G2-15-031-007  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:48-54`
- vNext now: `src/components/courses/faculty-course-workspace.tsx:109-145`
- Fix: Legacy Add content dropdown and icons vs new per-item controls and status badges.

## G2-15-031-019  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quizzes/QuizzesContent.jsx:22-38`
- vNext now: `src/components/courses/faculty-course-workspace.tsx:177-192`
- Fix: Legacy QuizBuilderModal course+lesson selection vs faculty inline authoring section.

## G2-15-031-026  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quizzes/QuizzesContent.jsx:22-38`
- vNext now: `src/components/courses/faculty-course-workspace.tsx:177-192`
- Fix: Legacy quiz picker/modal vs page-level editor.

## G2-15-031-042  [P2] GAP  facet F14  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:18-28`
- vNext now: `src/components/courses/faculty-course-workspace.tsx:11-28`
- Fix: Old syllabus video/resources/live upload drawers vs new video manager and material readiness.
