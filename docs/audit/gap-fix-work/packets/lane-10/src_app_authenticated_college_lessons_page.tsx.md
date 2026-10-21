# Work packet: edit src/app/(authenticated)/college/lessons/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/lesson-search-controller.md

## G2-13-013-018  [P1] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:65-68` scoped superadmin can supply courseId and requireAccessCourse
- vNext now: `src/app/(authenticated)/admin/lessons/page.tsx:36-40` selected college required, `src/app/(authenticated)/college/lessons/page.tsx:19` membership required
- Fix: Add authorized global-superadmin lesson search without selected college for parity, with optional college/course filters
