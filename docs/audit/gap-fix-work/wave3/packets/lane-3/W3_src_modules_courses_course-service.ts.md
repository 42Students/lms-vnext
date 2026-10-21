# Work packet (wave 3): edit src/modules/courses/course-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l19-u027-course-controller.md

## G2-19-027-034  [P1] MISSING  facet F10  effort L
- Legacy: Legacy fetchDeletedCourses and restoreCourse after college check and audit COURSE_RESTORE; CourseController.java:450-480; CourseServiceImpl.java:190-217
- vNext now: No course restore export in course-service.ts:1-435; `/api/courses/[courseId]` offers PATCH/DELETE only; [courseId]/route.ts:13-65
- Fix: Implement restore of archived course with collision and tenant/child integrity checks; audit event and UI confirmation.

## G2-19-027-058  [P1] MISSING  facet F23  effort L
- Legacy: Legacy archived/recycle flows use `deleted` + `restore`, independent Active/Enabled, slug IDs and exact admin copy; CourseController.java:450-480; CourseDTO.java:27-31
- vNext now: No course-level restore endpoint in `/api/courses` or course-service.ts:1-435, status ACTIVE/ARCHIVED; validation.ts:33-88
- Fix: Treat restore and visibility independence as explicit product parity gaps, not merely icon differences.
