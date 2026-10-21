# Work packet (wave 2): edit drizzle/0004_courses_c2_learning.sql

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/lesson-search-controller.md, docs/audit/gap2/lane-18/u001-faculty-course-tab.md

## G2-13-013-055  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LessonRepository.java:11-15` getLessons scoped by course_id and is_deleted, `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchCache.java:50` uses findAll + l.isActive only
- vNext now: `src/modules/courses/college-learning-directory-service.ts:91-108` joins paths/offerings/active college; migration `drizzle/0004_courses_c2_learning.sql:69-77` FK and indexes
- Fix: Document archived/deleted filtering mismatch in search vs normal course APIs

## G2-18-001-102  [P2] GAP  facet F22  effort M
- Legacy: Legacy lesson table uses lesson_name, course_id, active/enabled, sequence, version. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Lesson.java:15-40`
- vNext now: vNext course_lessons UUID learning_path_id, name, status/sequence with uniqueness and active indexes. `src/db/schema/courses.ts:320-360`, `drizzle/0004_courses_c2_learning.sql:15-24`
- Fix: Specify mapping of active/enabled/version semantics to status and optimistic concurrency; verify migrated content order.
