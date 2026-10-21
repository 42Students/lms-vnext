# Work packet (wave 2): edit src/modules/courses/super-admin-student-course-progress.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/course-progress.md, docs/audit/gap2/lane-19/course-progress.md, docs/audit/gap2/lane-2/admin-course-progress-controller.md

## G2-14-003-018  [P2] GAP  facet F04  effort S
- Legacy: Legacy Student #ID fallback and roll em dash; vNext studentName fallback Student and no roll — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:166-168`
- vNext now: `src/modules/courses/super-admin-student-course-progress.ts:41-43`; `src/app/(authenticated)/admin/course-progress/students/page.tsx:55-62`
- Fix: Use Student #ID fallback and em dash for missing roll

## G2-14-003-025  [P2] GAP  facet F05  effort M
- Legacy: Legacy table pageSize20, showSizeChanger, horizontal scroll; vNext DataTable has no explicit pagination and hard truncate500 — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:379-386`
- vNext now: `src/app/(authenticated)/admin/course-progress/students/page.tsx:50-65`; `src/modules/courses/super-admin-student-course-progress.ts:112-134`
- Fix: Add 20-size pagination and horizontal column behavior

## G2-14-003-072  [P2] GAP  facet F19  effort M
- Legacy: Legacy fetching one class roster minimizes reporting scope; vNext aggregates all active deliveries in one offering — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:132-138`
- vNext now: `src/modules/courses/super-admin-student-course-progress.ts:40-57`
- Fix: Offer per-class selection, avoid mixing sections for metrics

## G2-14-003-080  [P2] GAP  facet F22  effort M
- Legacy: Legacy backend API courseId/classId numeric, vNext offeringId UUID; migration loses direct legacy deep-link — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:83-113`
- vNext now: `src/modules/courses/super-admin-course-progress-query.ts:19-24`; `src/modules/courses/super-admin-student-course-progress.ts:20-38`
- Fix: Provide mapping resolver from scoped course/class to offering/delivery

## G2-19-003-012  [P2] GAP  facet F04  effort S
- Legacy: Student name fallback Student #learnerId and roll number dash `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:166-168`
- vNext now: DB coalesce display name Student, no roll cell `src/modules/courses/super-admin-student-course-progress.ts:40-43` `src/app/(authenticated)/admin/course-progress/students/page.tsx:55-58`
- Fix: Use safe identifiable fallback and em-dash missing roll.

## G2-19-003-044  [P2] GAP  facet F12  effort L
- Legacy: Legacy denominator only visible shared/targeted content `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:115-131`
- vNext now: vNext published ancestry plus per-delivery eligibility `src/modules/courses/super-admin-student-course-progress.ts:58-77`
- Fix: Map archived/hidden legacy records to published states correctly.

## G2-19-003-069  [P2] GAP  facet F21  effort L
- Legacy: Legacy assignment and quiz submissions plus video progress `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:167-185`
- vNext now: vNext uses separate submission/quiz/content schemas `src/modules/courses/super-admin-student-course-progress.ts:79-102`
- Fix: Verify attempt completion status filters and migration IDs.

## G2-2-015-065  [P2] GAP  facet F04  effort M
- Legacy: Legacy backend response carries learnerId, name, rollNumber, completed, videosCompleted, assignmentsSubmitted, quizzesAttempted, percent `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:199-209`
- vNext now: Super Admin query returns membershipId, studentName, videos, assignments, quizzes and totals only `src/modules/courses/super-admin-student-course-progress.ts:11-16,115-122`
- Fix: Publish typed legacy-to-new DTO mapping for each report field and include roll/completed values

## G2-2-015-068  [P2] GAP  facet F05  effort M
- Legacy: Default table sorted by completion ascending; AntD pager 20 with size chooser `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:187-194,379-386`
- vNext now: Super Admin rows sorted student name in SQL, DataTable no progress sorter/page control `src/modules/courses/super-admin-student-course-progress.ts:112-114` `src/app/(authenticated)/admin/course-progress/students/page.tsx:50-65`
- Fix: Sort by computed progress ascending and add 20-row paged view

## G2-2-015-072  [P2] GAP  facet F10  effort L
- Legacy: GET /api/v1/admin/course-progress?courseId&classId composes content, assignments and quiz SQL `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:83-216`
- vNext now: Super Admin reports are server-rendered SQL, with separate optional CSV read `src/modules/courses/super-admin-student-course-progress.ts:20-134`
- Fix: Document and expose equivalent class/course to offering relationship for caller migration
