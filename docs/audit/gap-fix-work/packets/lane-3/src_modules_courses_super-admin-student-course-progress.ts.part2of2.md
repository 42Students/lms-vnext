# Work packet: edit src/modules/courses/super-admin-student-course-progress.ts (part 2 of 2)

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/course-progress.md, docs/audit/gap2/lane-2/admin-course-progress-controller.md, docs/audit/gap2/lane-2/admin-learner-progress-controller.md

## G2-19-003-063  [P1] GAP  facet F19  effort L
- Legacy: Legacy full class roster, table client-page20 `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:132-215` `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:379-386`
- vNext now: vNext SQL LIMIT 501 then returns 500 max `src/modules/courses/super-admin-student-course-progress.ts:112-121`
- Fix: Implement server paging with true totals and no truncation.

## G2-19-003-064  [P1] GAP  facet F19  effort L
- Legacy: Legacy class-specific items count `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:115-151`
- vNext now: vNext per-offering active delivery counts `src/modules/courses/super-admin-student-course-progress.ts:40-111`
- Fix: Scope count to selected class delivery.

## G2-19-003-068  [P1] GAP  facet F21  effort L
- Legacy: Legacy teaching assignment lookup integrated with report `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:105-133` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:101-112`
- vNext now: vNext uses active delivery enrollment joins `src/modules/courses/super-admin-student-course-progress.ts:40-55`
- Fix: Map historical teaching assignments and current deliveries.

## G2-19-003-070  [P1] GAP  facet F22  effort L
- Legacy: Legacy learner/class/teaching assignment linked by IDs `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:101-134`
- vNext now: vNext UUID membership/section_enrollment/delivery joins `src/modules/courses/super-admin-student-course-progress.ts:40-55`
- Fix: Document and migrate class/course/member ID mapping.

## G2-19-003-071  [P1] GAP  facet F22  effort L
- Legacy: Legacy past course teaching assignments selectable `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:105-126`
- vNext now: vNext excludes ended deliveries and inactive sections `src/modules/courses/super-admin-student-course-progress.ts:43-55`
- Fix: Add authorized historical class progress.

## G2-19-003-072  [P1] GAP  facet F22  effort M
- Legacy: Legacy aggregate counts all learners even >500 `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:132-215`
- vNext now: vNext derives mean from first 500 rows `src/modules/courses/super-admin-student-course-progress.ts:112-121` `src/app/(authenticated)/admin/course-progress/students/page.tsx:30-46`
- Fix: Aggregate in database before pagination.

## G2-19-003-074  [P1] GAP  facet F23  effort L
- Legacy: Legacy unbounded class learner count `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:132-215`
- vNext now: vNext explicitly 500 cap and warning `src/modules/courses/super-admin-student-course-progress.ts:112-121` `src/app/(authenticated)/admin/course-progress/students/page.tsx:49`
- Fix: Replace cap with server paging.

## G2-2-015-073  [P1] GAP  facet F10  effort L
- Legacy: Legacy loads completed video counts only for latest attempt `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerContentProgressRepository.java:89-99`
- vNext now: Super Admin query counts distinct completed progress rows without retake attempt filter `src/modules/courses/super-admin-student-course-progress.ts:78-86`
- Fix: Add explicit attempt-scope version semantics or verified period reset of prior completions

## G2-2-015-089  [P1] GAP  facet F19  effort L
- Legacy: Backend retrieves full active class roster and returns all rows `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:132-134,185-215`
- vNext now: Super Admin caps roster to 500, warning rendered after cap `src/modules/courses/super-admin-student-course-progress.ts:112-122,134` `src/app/(authenticated)/admin/course-progress/students/page.tsx:49-50`
- Fix: Use server pagination with exact counts and full CSV; never compute global mean from capped page

## G2-2-017-060  [P1] GAP  facet F22  effort M
- Legacy: Past completion does not count after incomplete latest attempt `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerContentProgressRepository.java:89-99`
- vNext now: Super Admin counts distinct completed content rows without latest attempt `src/modules/courses/super-admin-student-course-progress.ts:78-86`
- Fix: Use latest attempt CTE for aggregate

## G2-19-003-026  [P2] GAP  facet F07  effort M
- Legacy: Backend error courseId is required and classId is required `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:83-96`
- vNext now: Detail expects offeringId UUID and Choose a course offering `src/modules/courses/super-admin-student-course-progress.ts:20-23` `src/app/(authenticated)/admin/course-progress/students/page.tsx:18-23`
- Fix: Preserve class/course field-level requirement semantics.

## G2-2-015-071  [P2] GAP  facet F07  effort M
- Legacy: Backend 400 `This course is not taught in this class` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:105-113`
- vNext now: Super Admin checks offering membership but doesn't expose invalid class/course relationship wording `src/modules/courses/super-admin-student-course-progress.ts:28-38`
- Fix: Differentiate invalid taught-pair from missing/non-tenant scoped offering without leaking data
