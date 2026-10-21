# Work packet: edit src/modules/courses/super-admin-student-progress-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/course-progress.md

## G2-19-003-029  [P2] GAP  facet F07  effort S
- Legacy: Backend no measured work/no active learner returns explicit note `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:153-161`
- vNext now: Detail returns Not measured or no enrolled students `src/modules/courses/super-admin-student-progress-model.ts:5-13` `src/app/(authenticated)/admin/course-progress/students/page.tsx:59-65`
- Fix: Distinguish no measured items versus empty roster using exact notes.
