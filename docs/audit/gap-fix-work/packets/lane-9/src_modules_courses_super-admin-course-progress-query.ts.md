# Work packet: edit src/modules/courses/super-admin-course-progress-query.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/course-progress.md

## G2-14-003-032  [P2] GAP  facet F07  effort S
- Legacy: Legacy bad courseId/classId returns courseId is required / classId is required; vNext invalid offeringId yields Choose a course offering — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:83-95`
- vNext now: `src/modules/courses/super-admin-course-progress-query.ts:19-24`; `src/app/(authenticated)/admin/course-progress/students/page.tsx:20-23`
- Fix: Map missing class/course field errors to legacy wording
