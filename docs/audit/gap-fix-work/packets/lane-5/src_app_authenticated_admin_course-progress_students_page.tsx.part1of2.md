# Work packet: edit src/app/(authenticated)/admin/course-progress/students/page.tsx (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/course-progress.md, docs/audit/gap2/lane-19/course-progress.md, docs/audit/gap2/lane-2/admin-course-progress-controller.md

## G2-14-003-015  [P1] MISSING  facet F04  effort M
- Legacy: Legacy student row Roll number column and CSV roll; vNext student detail omits roll in query, table and export — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:166-168,212-224`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:199-209`
- vNext now: `src/modules/courses/super-admin-student-course-progress.ts:78-114`; `src/app/(authenticated)/admin/course-progress/students/page.tsx:50-64`; `src/app/api/admin/course-progress/students/export/route.ts:19-25`
- Fix: Join learnerProfiles.rollNumber and expose in table and CSV between Student and Videos

## G2-14-003-021  [P1] GAP  facet F05  effort L
- Legacy: Legacy class picker first then course restricted to selected class teaching assignments; vNext listing uses cohort/offering selectors and status, no mandatory class — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:97-134,247-282`
- vNext now: `src/app/(authenticated)/admin/course-progress/page.tsx:48-63`; `src/app/(authenticated)/admin/course-progress/students/page.tsx:13-23`
- Fix: Add required Class and derived taught Course controls on current screen

## G2-14-003-024  [P1] GAP  facet F05  effort M
- Legacy: Legacy per-student initial ascending percent sort (furthest behind), numeric header clickable; vNext SQL name ASC and no progress sorting — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:187-193,372-384`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:211-211`
- vNext now: `src/modules/courses/super-admin-student-course-progress.ts:112-114`; `src/app/(authenticated)/admin/course-progress/students/page.tsx:50-65`
- Fix: Sort by computed percent ASC, tie by stable name, enable column sorting

## G2-14-003-033  [P1] GAP  facet F07  effort M
- Legacy: Legacy pair not taught returns This course is not taught in this class; vNext offering read validates tenant but not exact legacy pair message — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:105-113`
- vNext now: `src/modules/courses/super-admin-student-course-progress.ts:28-38`; `src/app/(authenticated)/admin/course-progress/students/page.tsx:24-29`
- Fix: Enforce section teaching binding and show exact invalid pair error

## G2-14-003-071  [P1] GAP  facet F19  effort L
- Legacy: Legacy backend returns all active class learners and AG table paginates20; vNext SQL hard-limit501, trims to500 and no pages — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:132-138,185-216`
- vNext now: `src/modules/courses/super-admin-student-course-progress.ts:112-134`; `src/app/(authenticated)/admin/course-progress/students/page.tsx:49-65`
- Fix: Paginate DB scoped learner data beyond500, preserve stable percent sorting

## G2-19-003-004  [P1] GAP  facet F02  effort L
- Legacy: Title then measured-work warning, class/course controls, four stats, per-student table `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:231-388`
- vNext now: PageHeader then q/status offering filters and offering cards; student stats on another route `src/app/(authenticated)/admin/course-progress/page.tsx:39-93` `src/app/(authenticated)/admin/course-progress/students/page.tsx:36-65`
- Fix: Restore original screen section order and combined report.

## G2-19-003-011  [P1] GAP  facet F04  effort M
- Legacy: Legacy table six columns Student, Roll number, Videos, Assignments, Quizzes, Progress `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:166-205`
- vNext now: vNext detail five columns, omits Roll number `src/app/(authenticated)/admin/course-progress/students/page.tsx:54-63`
- Fix: Join scoped roll number and add table column.

## G2-19-003-013  [P1] GAP  facet F04  effort L
- Legacy: Video, assignment, quiz cells show completed/total denominators `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:169-185`
- vNext now: Per learner counts same syntax but denominator derived from active eligible deliveries `src/app/(authenticated)/admin/course-progress/students/page.tsx:56-58` `src/modules/courses/super-admin-student-course-progress.ts:103-111`
- Fix: Validate equivalent class denominator under multi-section offerings.

## G2-19-003-015  [P1] GAP  facet F04  effort L
- Legacy: Average completion computed on all active class learners `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:132-160` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:186-215`
- vNext now: Mean computed from capped 500 member rows `src/app/(authenticated)/admin/course-progress/students/page.tsx:30-46` `src/modules/courses/super-admin-student-course-progress.ts:112-121`
- Fix: Compute aggregate over full selected roster, not truncated slice.

## G2-19-003-020  [P1] GAP  facet F05  effort M
- Legacy: Student rows default sorted worst percentage first; Progress is sortable `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:188-194` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:211-214`
- vNext now: SQL orders alphabetically by studentName, no progress sorting `src/modules/courses/super-admin-student-course-progress.ts:112-113` `src/app/(authenticated)/admin/course-progress/students/page.tsx:50-65`
- Fix: Sort by completion ascending, support sortable Progress column.

## G2-19-003-021  [P1] GAP  facet F05  effort L
- Legacy: Per-student table starts with pageSize20 and size changer `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:379-386`
- vNext now: Detail receives at most 500 and no explicit pagination `src/modules/courses/super-admin-student-course-progress.ts:112-121` `src/app/(authenticated)/admin/course-progress/students/page.tsx:50-65`
- Fix: Implement server paging default 20 with page size selector.

## G2-19-003-035  [P1] GAP  facet F10  effort L
- Legacy: GET /api/v1/admin/course-progress with courseId and classId `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:83-104`
- vNext now: Directory + /students?offeringId split queries `src/app/(authenticated)/admin/course-progress/page.tsx:36` `src/app/(authenticated)/admin/course-progress/students/page.tsx:18-25`
- Fix: Expose selected class/course report with equivalent request params.

## G2-19-003-050  [P1] GAP  facet F14  effort M
- Legacy: Legacy export 10 columns learnerId,name,rollNumber,video and quiz counts, percent `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:212-225`
- vNext now: vNext student screen CSV link but no roll table column `src/app/(authenticated)/admin/course-progress/students/page.tsx:50-69`
- Fix: Compare exported columns; restore rollNumber and class/course boundaries.

## G2-19-003-072  [P1] GAP  facet F22  effort M
- Legacy: Legacy aggregate counts all learners even >500 `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:132-215`
- vNext now: vNext derives mean from first 500 rows `src/modules/courses/super-admin-student-course-progress.ts:112-121` `src/app/(authenticated)/admin/course-progress/students/page.tsx:30-46`
- Fix: Aggregate in database before pagination.

## G2-19-003-074  [P1] GAP  facet F23  effort L
- Legacy: Legacy unbounded class learner count `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:132-215`
- vNext now: vNext explicitly 500 cap and warning `src/modules/courses/super-admin-student-course-progress.ts:112-121` `src/app/(authenticated)/admin/course-progress/students/page.tsx:49`
- Fix: Replace cap with server paging.

## G2-2-015-062  [P1] GAP  facet F02  effort L
- Legacy: Original order is title/info, selector Card, summary cards, Per student Table `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:231-388`
- vNext now: Super Admin splits the directory `src/app/(authenticated)/admin/course-progress/page.tsx:39-104` from the measurements `src/app/(authenticated)/admin/course-progress/students/page.tsx:36-70`
- Fix: Render the complete metric/report flow in the same selected class/course view

## G2-2-015-064  [P1] MISSING  facet F04  effort M
- Legacy: Six student columns include Roll number between Student and Videos `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:166-205`
- vNext now: Super Admin renders five columns, no roll field `src/app/(authenticated)/admin/course-progress/students/page.tsx:54-63`
- Fix: Join learnerProfiles.roll_number and add Roll number to details and export

## G2-2-015-067  [P1] GAP  facet F04  effort L
- Legacy: Backend rounds each learner percentage and then mean of roster percentages `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:185-215`
- vNext now: Super Admin mean uses only measurable rows of capped result `src/app/(authenticated)/admin/course-progress/students/page.tsx:30-35`
- Fix: Compute mean over all eligible roster members and preserve null/no-work rules

## G2-2-015-089  [P1] GAP  facet F19  effort L
- Legacy: Backend retrieves full active class roster and returns all rows `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:132-134,185-215`
- vNext now: Super Admin caps roster to 500, warning rendered after cap `src/modules/courses/super-admin-student-course-progress.ts:112-122,134` `src/app/(authenticated)/admin/course-progress/students/page.tsx:49-50`
- Fix: Use server pagination with exact counts and full CSV; never compute global mean from capped page

## G2-14-003-032  [P2] GAP  facet F07  effort S
- Legacy: Legacy bad courseId/classId returns courseId is required / classId is required; vNext invalid offeringId yields Choose a course offering — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:83-95`
- vNext now: `src/modules/courses/super-admin-course-progress-query.ts:19-24`; `src/app/(authenticated)/admin/course-progress/students/page.tsx:20-23`
- Fix: Map missing class/course field errors to legacy wording
