# Work packet (wave 3): edit src/app/api/courses/[courseId]/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l19-u027-course-controller.md

## G2-19-027-034  [P1] MISSING  facet F10  effort L
- Legacy: Legacy fetchDeletedCourses and restoreCourse after college check and audit COURSE_RESTORE; CourseController.java:450-480; CourseServiceImpl.java:190-217
- vNext now: No course restore export in course-service.ts:1-435; `/api/courses/[courseId]` offers PATCH/DELETE only; [courseId]/route.ts:13-65
- Fix: Implement restore of archived course with collision and tenant/child integrity checks; audit event and UI confirmation.
