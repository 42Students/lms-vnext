# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-18-003-110 [P1] GAP facet F22
- Files: src/modules/courses/validation.ts, src/modules/courses/course-service.ts, src/db/schema/courses.ts
- Legacy: Legacy shortTitle max64 and optional courseCode40; vNext shortTitle120, required code64 with DB uniqueness. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:50-61`
- Expected fix: Document constraint collisions and migration/coercion, test longest persisted values.

## G2-19-007-001 [P1] GAP facet F01
- Files: src/app/(authenticated)/college/courses/offerings/[offeringId]/page.tsx
- Legacy: Legacy route `/college-admin/courses/[id]` accepts `crs-` slug and numeric ID `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:60-69` `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:93-116`
- Expected fix: Add compatibility redirects resolving authorized numeric course IDs/slugs to the correct offering.

## G2-19-007-015 [P1] GAP facet F04
- Files: src/components/courses/admin-offering-learning-page.tsx
- Legacy: Legacy Home `In this Course` content from meta_data introduction/html/takeaways `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseHome.jsx:287-315`
- Expected fix: Render existing rich HTML+takeaways read-only course preview below Home heading.

## G2-19-007-030 [P1] GAP facet F07
- Files: src/components/courses/admin-offering-learning-page.tsx, src/components/courses/admin-offering-section-preview.tsx
- Legacy: Legacy class list failure `Sections couldn't be loaded, so you're seeing shared content only.` with Retry `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:385-389`
- Expected fix: Keep shared syllabus usable when section list fails; show targeted Retry.

## G2-19-007-038 [P1] GAP facet F10
- Files: src/components/courses/admin-offering-learning-page.tsx
- Legacy: Legacy course GET by slug, class names and numeric fetch endpoints `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:2-7` `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:69-95`
- Expected fix: Map course, offering and class data joins; support URL redirect from old IDs.

## G2-19-007-039 [P1] GAP facet F10
- Files: src/components/courses/admin-offering-learning-page.tsx, src/components/courses/admin-offering-learning-overview.tsx
- Legacy: Legacy class-specific syllabus reads `getSpecificCourseContent`, generic by slug/id `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:555-568`
- Expected fix: Expose targeted mixed shared+section content view for authorized class.

## G2-19-007-050 [P1] GAP facet F13
- Files: src/components/courses/admin-offering-learning-page.tsx
- Legacy: Legacy section fetch failure shows shared-only warning but keeps lessons `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:385-410`
- Expected fix: Gracefully degrade section preview rather than block entire course page.

## G2-19-007-068 [P1] GAP facet F19
- Files: src/components/courses/admin-offering-learning-page.tsx
- Legacy: Legacy two concurrent requests course/class names via Promise.allSettled, tolerates failed class lookup `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:69-90`
- Expected fix: Use independent failure boundaries so shared course remains available.

## G2-19-007-074 [P1] GAP facet F21
- Files: src/components/courses/admin-offering-learning-page.tsx
- Legacy: Legacy courseServices getCourse/getCourseBySlug/getClassName and Redux currAdminCourse `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:2-14` `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:51-90`
- Expected fix: Create explicit compatibility mapping from courseId/slug to offering/section/delivery.

## G2-19-007-077 [P1] GAP facet F22
- Files: src/components/courses/admin-offering-learning-page.tsx
- Legacy: Legacy course meta_data intro/html/takeaways stored on course `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseHome.jsx:309-315`
- Expected fix: Migrate old metadata and preserve sanitized HTML/takeaway order/version history.

## G2-19-003-015 [P1] GAP facet F04
- Files: src/app/(authenticated)/admin/course-progress/students/page.tsx, src/modules/courses/super-admin-student-course-progress.ts
- Legacy: Average completion computed on all active class learners `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:132-160` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:186-215`
- Expected fix: Compute aggregate over full selected roster, not truncated slice.

## G2-19-003-020 [P1] GAP facet F05
- Files: src/modules/courses/super-admin-student-course-progress.ts, src/app/(authenticated)/admin/course-progress/students/page.tsx
- Legacy: Student rows default sorted worst percentage first; Progress is sortable `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:188-194` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:211-214`
- Expected fix: Sort by completion ascending, support sortable Progress column.

## G2-19-003-021 [P1] GAP facet F05
- Files: src/modules/courses/super-admin-student-course-progress.ts, src/app/(authenticated)/admin/course-progress/students/page.tsx
- Legacy: Per-student table starts with pageSize20 and size changer `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:379-386`
- Expected fix: Implement server paging default 20 with page size selector.

## G2-19-003-027 [P1] GAP facet F07
- Files: src/modules/courses/super-admin-student-course-progress.ts
- Legacy: Backend rejects unrelated class/course with This course is not taught in this class `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:101-112`
- Expected fix: Validate teaching-assignment mapping for selected class and course.

## G2-19-003-036 [P1] GAP facet F10
- Files: src/app/(authenticated)/admin/course-progress/page.tsx, src/modules/courses/super-admin-student-course-progress.ts
- Legacy: Response has learner name/roll/percent counts and class aggregate `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:135-215`
- Expected fix: Map all old response fields in one scoped model.

## G2-19-003-038 [P1] GAP facet F11
- Files: src/modules/courses/super-admin-student-course-progress.ts
- Legacy: Legacy requires authorization against BOTH course and class `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:101-104`
- Expected fix: Require class+course scope on class-specific report.

## G2-19-003-042 [P1] GAP facet F12
- Files: src/modules/courses/super-admin-student-course-progress.ts
- Legacy: Legacy quiz attempts counted only when submitted_at not null `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:179-183`
- Expected fix: Exclude unfinished quiz attempts from completed counts.

## G2-19-003-064 [P1] GAP facet F19
- Files: src/modules/courses/super-admin-student-course-progress.ts
- Legacy: Legacy class-specific items count `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:115-151`
- Expected fix: Scope count to selected class delivery.

## G2-19-003-068 [P1] GAP facet F21
- Files: src/modules/courses/super-admin-student-course-progress.ts
- Legacy: Legacy teaching assignment lookup integrated with report `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:105-133` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:101-112`
- Expected fix: Map historical teaching assignments and current deliveries.

## G2-19-003-070 [P1] GAP facet F22
- Files: src/modules/courses/super-admin-student-course-progress.ts
- Legacy: Legacy learner/class/teaching assignment linked by IDs `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:101-134`
- Expected fix: Document and migrate class/course/member ID mapping.

## G2-19-003-071 [P1] GAP facet F22
- Files: src/modules/courses/super-admin-student-course-progress.ts
- Legacy: Legacy past course teaching assignments selectable `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:105-126`
- Expected fix: Add authorized historical class progress.

## G2-19-003-072 [P1] GAP facet F22
- Files: src/modules/courses/super-admin-student-course-progress.ts, src/app/(authenticated)/admin/course-progress/students/page.tsx
- Legacy: Legacy aggregate counts all learners even >500 `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:132-215`
- Expected fix: Aggregate in database before pagination.

## G2-19-003-074 [P1] GAP facet F23
- Files: src/modules/courses/super-admin-student-course-progress.ts, src/app/(authenticated)/admin/course-progress/students/page.tsx
- Legacy: Legacy unbounded class learner count `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:132-215`
- Expected fix: Replace cap with server paging.

## G2-19-019-065 [P1] GAP facet F21
- Files: src/modules/courses/teaching-assignment-service.ts
- Legacy: Legacy class/lesson/quiz/attendance consumers query facultyId+courseId+classId active/undeleted predicates. `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/FacultyTeachingAssignmentRepository.java:101-121` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/FacultyTeachingAssignmentRepository.java:145-152`
- Expected fix: Verify all authorization consumers map faculty/course/class checks to persisted delivery without privilege escalation.

## G2-19-004-078 [P1] GAP facet F20
- Files: src/app/(authenticated)/learn/my-placements/schedule/page.tsx
- Legacy: Legacy pending move request excluded from confirm-alert count `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:124`
- Expected fix: Exclude pending reschedule and invalid/expired bookings from needsConfirmation.
