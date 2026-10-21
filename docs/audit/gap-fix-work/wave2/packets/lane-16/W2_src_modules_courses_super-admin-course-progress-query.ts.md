# Work packet (wave 2): edit src/modules/courses/super-admin-course-progress-query.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/course-progress.md

## G2-14-003-028  [P2] GAP  facet F06  effort M
- Legacy: Legacy required Class and Course selection default null; vNext offeringId UUID detail route is required, selected by external list — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:35-40,97-134`
- vNext now: `src/modules/courses/super-admin-course-progress-query.ts:19-24`; `src/app/(authenticated)/admin/course-progress/students/page.tsx:13-23`
- Fix: Use class→course controlled selector, clear dependent fields on change

## G2-14-003-029  [P2] GAP  facet F06  effort M
- Legacy: Legacy class choice clears course/results/error; vNext filter GET can preserve courseCode/cohortCode independently — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:97-105,265-278`
- vNext now: `src/app/(authenticated)/admin/course-progress/page.tsx:48-63`; `src/modules/courses/super-admin-course-progress-query.ts:6-16`
- Fix: Reset course when class changes, clear stale report

## G2-14-003-080  [P2] GAP  facet F22  effort M
- Legacy: Legacy backend API courseId/classId numeric, vNext offeringId UUID; migration loses direct legacy deep-link — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:83-113`
- vNext now: `src/modules/courses/super-admin-course-progress-query.ts:19-24`; `src/modules/courses/super-admin-student-course-progress.ts:20-38`
- Fix: Provide mapping resolver from scoped course/class to offering/delivery
