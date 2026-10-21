# Work packet: edit src/app/(authenticated)/admin/course-progress/page.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/course-progress.md, docs/audit/gap2/lane-19/course-progress.md, docs/audit/gap2/lane-2/admin-course-progress-controller.md, docs/audit/gap2/lane-2/admin-learner-progress-controller.md

## G2-14-003-021  [P1] GAP  facet F05  effort L
- Legacy: Legacy class picker first then course restricted to selected class teaching assignments; vNext listing uses cohort/offering selectors and status, no mandatory class — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:97-134,247-282`
- vNext now: `src/app/(authenticated)/admin/course-progress/page.tsx:48-63`; `src/app/(authenticated)/admin/course-progress/students/page.tsx:13-23`
- Fix: Add required Class and derived taught Course controls on current screen

## G2-19-003-001  [P1] GAP  facet F01  effort L
- Legacy: Course Progress heading and class/course completion purpose `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:231-245`
- vNext now: Progress heading and offering-level recorded-activity purpose `src/app/(authenticated)/admin/course-progress/page.tsx:39-46`
- Fix: Restore class/course measured-completion default route and exact page title.

## G2-19-003-004  [P1] GAP  facet F02  effort L
- Legacy: Title then measured-work warning, class/course controls, four stats, per-student table `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:231-388`
- vNext now: PageHeader then q/status offering filters and offering cards; student stats on another route `src/app/(authenticated)/admin/course-progress/page.tsx:39-93` `src/app/(authenticated)/admin/course-progress/students/page.tsx:36-65`
- Fix: Restore original screen section order and combined report.

## G2-19-003-017  [P1] GAP  facet F05  effort L
- Legacy: Choose Class first, Course dropdown limited to its teaching assignments `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:249-282`
- vNext now: Course/cohort/active status offering filters, no Class select `src/app/(authenticated)/admin/course-progress/page.tsx:48-61`
- Fix: Restore class-first dependent options from teaching assignments.

## G2-19-003-035  [P1] GAP  facet F10  effort L
- Legacy: GET /api/v1/admin/course-progress with courseId and classId `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:83-104`
- vNext now: Directory + /students?offeringId split queries `src/app/(authenticated)/admin/course-progress/page.tsx:36` `src/app/(authenticated)/admin/course-progress/students/page.tsx:18-25`
- Fix: Expose selected class/course report with equivalent request params.

## G2-19-003-036  [P1] GAP  facet F10  effort L
- Legacy: Response has learner name/roll/percent counts and class aggregate `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:135-215`
- vNext now: Directory offers only offering aggregates and student route omits roll `src/app/(authenticated)/admin/course-progress/page.tsx:69-83` `src/modules/courses/super-admin-student-course-progress.ts:12-16`
- Fix: Map all old response fields in one scoped model.

## G2-2-015-061  [P1] GAP  facet F01  effort L
- Legacy: The legacy route is a single direct class/course report `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:231-245`
- vNext now: Super Admin /admin/course-progress opens an offering directory; student detail is a second route `src/app/(authenticated)/admin/course-progress/page.tsx:39-93`
- Fix: Make class+course measured completion the primary Super Admin surface; preserve directory as a secondary view

## G2-2-015-062  [P1] GAP  facet F02  effort L
- Legacy: Original order is title/info, selector Card, summary cards, Per student Table `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:231-388`
- vNext now: Super Admin splits the directory `src/app/(authenticated)/admin/course-progress/page.tsx:39-104` from the measurements `src/app/(authenticated)/admin/course-progress/students/page.tsx:36-70`
- Fix: Render the complete metric/report flow in the same selected class/course view

## G2-2-017-002  [P1] MISSING  facet F01  effort M
- Legacy: Single action for learner and course `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:68-74`
- vNext now: Super Admin Course Progress offers directory + export, not a next-attempt action `src/app/(authenticated)/admin/course-progress/page.tsx:39-104`
- Fix: Expose scoped admin retake action on student detail

## G2-19-003-028  [P2] GAP  facet F07  effort S
- Legacy: Metadata failure message Some course-progress filters could not be loaded... `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:78-90`
- vNext now: vNext Course and cohort filter choices temporarily unavailable `src/app/(authenticated)/admin/course-progress/page.tsx:64-66`
- Fix: Restore exact metadata failure copy with targeted retry.

## G2-19-003-031  [P2] GAP  facet F08  effort M
- Legacy: Failed refresh warns Couldn't refresh course progress, keeps previously loaded data `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:318-326`
- vNext now: No equivalent on-page refresh state `src/app/(authenticated)/admin/course-progress/page.tsx:36-46`
- Fix: Retain last matching scope data and show warning/retry.

## G2-19-003-032  [P2] GAP  facet F08  effort S
- Legacy: CSV silently saves filename course-progress-courseId-class-classId.csv `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:207-225`
- vNext now: vNext export offering CSV filename course-progress.csv `src/app/(authenticated)/admin/course-progress/page.tsx:99-101`
- Fix: Name export per selected class/course.
