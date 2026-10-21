# Work packet: edit src/modules/courses/super-admin-student-course-progress.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/course-progress.md, docs/audit/gap2/lane-19/course-progress.md

## G2-14-003-015  [P1] MISSING  facet F04  effort M
- Legacy: Legacy student row Roll number column and CSV roll; vNext student detail omits roll in query, table and export — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:166-168,212-224`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:199-209`
- vNext now: `src/modules/courses/super-admin-student-course-progress.ts:78-114`; `src/app/(authenticated)/admin/course-progress/students/page.tsx:50-64`; `src/app/api/admin/course-progress/students/export/route.ts:19-25`
- Fix: Join learnerProfiles.rollNumber and expose in table and CSV between Student and Videos

## G2-14-003-024  [P1] GAP  facet F05  effort M
- Legacy: Legacy per-student initial ascending percent sort (furthest behind), numeric header clickable; vNext SQL name ASC and no progress sorting — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:187-193,372-384`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:211-211`
- vNext now: `src/modules/courses/super-admin-student-course-progress.ts:112-114`; `src/app/(authenticated)/admin/course-progress/students/page.tsx:50-65`
- Fix: Sort by computed percent ASC, tie by stable name, enable column sorting

## G2-14-003-033  [P1] GAP  facet F07  effort M
- Legacy: Legacy pair not taught returns This course is not taught in this class; vNext offering read validates tenant but not exact legacy pair message — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:105-113`
- vNext now: `src/modules/courses/super-admin-student-course-progress.ts:28-38`; `src/app/(authenticated)/admin/course-progress/students/page.tsx:24-29`
- Fix: Enforce section teaching binding and show exact invalid pair error

## G2-14-003-039  [P1] GAP  facet F10  effort L
- Legacy: Legacy GET /api/v1/admin/course-progress?courseId=&classId= with course+class authorization; vNext server SQL offeringId and admin college scope — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:37-45,83-113`
- vNext now: `src/modules/courses/super-admin-student-course-progress.ts:20-39`
- Fix: Introduce class+course report service honoring legacy taught-in-class check

## G2-14-003-042  [P1] GAP  facet F11  effort M
- Legacy: Legacy must authorize both class and course and required teaching relation; vNext admin-scope selection + selected college persisted permission — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:96-113`
- vNext now: `src/modules/courses/super-admin-student-course-progress.ts:20-38,123-133`
- Fix: Validate both course and class (or delivery) scope and teaching binding

## G2-14-003-045  [P1] GAP  facet F12  effort M
- Legacy: Legacy assignments from visible lesson_contents type assignment; vNext standalone course_assignments PUBLISHED — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:140-144`
- vNext now: `src/modules/courses/super-admin-student-course-progress.ts:65-70`
- Fix: Map assignment units and visibility from legacy content to new assignments with parity fixtures

## G2-14-003-046  [P1] GAP  facet F12  effort M
- Legacy: Legacy quiz denominator PUBLISHED + active/enabled/not-deleted; vNext PUBLISHED or CLOSED, not requiring same enabled rules — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:68-72,145-149`
- vNext now: `src/modules/courses/super-admin-student-course-progress.ts:71-77`
- Fix: Apply equivalent visibility/active and published-only counting, specify CLOSED decision

## G2-14-003-047  [P1] GAP  facet F12  effort S
- Legacy: Legacy quiz numerator submitted_at IS NOT NULL and not deleted; vNext counts DISTINCT quiz_attempts without submittedAt filter — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:179-183`
- vNext now: `src/modules/courses/super-admin-student-course-progress.ts:95-101`
- Fix: Count only submitted and nondeleted attempts; exclude drafts

## G2-14-003-071  [P1] GAP  facet F19  effort L
- Legacy: Legacy backend returns all active class learners and AG table paginates20; vNext SQL hard-limit501, trims to500 and no pages — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:132-138,185-216`
- vNext now: `src/modules/courses/super-admin-student-course-progress.ts:112-134`; `src/app/(authenticated)/admin/course-progress/students/page.tsx:49-65`
- Fix: Paginate DB scoped learner data beyond500, preserve stable percent sorting

## G2-14-003-075  [P1] GAP  facet F20  effort S
- Legacy: Legacy quiz requires submitted timestamp; vNext current attempts may count draft/in-progress state — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:179-183`
- vNext now: `src/modules/courses/super-admin-student-course-progress.ts:95-101`
- Fix: Ensure submittedAt IS NOT NULL on attempts before counting

## G2-14-003-078  [P1] GAP  facet F22  effort L
- Legacy: Legacy lesson_contents classId/video/youtube/assignment and quizzes table, student_assignment & learner_content_progress; vNext course_offerings/course_section_deliveries/course_assignments/quiz_attempts — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:68-72,115-149,167-183`
- vNext now: `src/modules/courses/super-admin-student-course-progress.ts:40-77,78-114`; `src/db/schema/courses.ts:88-140`
- Fix: Document table/column mapping for legacy lesson-content assignment vs new course assignment and class scope

## G2-14-003-079  [P1] GAP  facet F22  effort M
- Legacy: Legacy learner roster classId and roll, vNext membership/enrollment/user but omits learnerProfiles in student detail query — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:132-138,199-209`
- vNext now: `src/modules/courses/super-admin-student-course-progress.ts:40-57,78-114`
- Fix: Join learnerProfiles and current class/section assignment; filter active enrollment/retake correctly

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

## G2-19-003-027  [P1] GAP  facet F07  effort L
- Legacy: Backend rejects unrelated class/course with This course is not taught in this class `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:101-112`
- vNext now: vNext checks offering and college, not explicit class/course teaching assignment `src/modules/courses/super-admin-student-course-progress.ts:28-55`
- Fix: Validate teaching-assignment mapping for selected class and course.

## G2-19-003-036  [P1] GAP  facet F10  effort L
- Legacy: Response has learner name/roll/percent counts and class aggregate `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:135-215`
- vNext now: Directory offers only offering aggregates and student route omits roll `src/app/(authenticated)/admin/course-progress/page.tsx:69-83` `src/modules/courses/super-admin-student-course-progress.ts:12-16`
- Fix: Map all old response fields in one scoped model.

## G2-19-003-038  [P1] GAP  facet F11  effort M
- Legacy: Legacy requires authorization against BOTH course and class `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:101-104`
- vNext now: vNext superadmin courses.read and offering college check `src/modules/courses/super-admin-student-course-progress.ts:20-38`
- Fix: Require class+course scope on class-specific report.

## G2-19-003-042  [P1] GAP  facet F12  effort M
- Legacy: Legacy quiz attempts counted only when submitted_at not null `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:179-183`
- vNext now: vNext any quiz_attempts row without submitted_at guard `src/modules/courses/super-admin-student-course-progress.ts:95-102`
- Fix: Exclude unfinished quiz attempts from completed counts.
