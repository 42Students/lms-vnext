# Work packet: edit src/modules/courses/college-learning-directory-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/lesson-search-controller.md

## G2-13-013-007  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchDTO.java:13-25` DTO fields id Integer, lessonName,courseId,courseSlug,courseName,active
- vNext now: `src/modules/courses/college-learning-directory-service.ts:76-91` and `src/modules/courses/college-learning-directory-model.ts:162-182` UUID id,name,learningPathId,courseCode/cohort/period/status etc; no courseSlug
- Fix: Define compatibility mapping for legacy DTO including courseSlug and active when consumers depend on it
