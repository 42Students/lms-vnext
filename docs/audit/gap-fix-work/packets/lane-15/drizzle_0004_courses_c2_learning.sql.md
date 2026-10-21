# Work packet: edit drizzle/0004_courses_c2_learning.sql

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/lesson-search-controller.md, docs/audit/gap2/lane-18/u002-superadmin-lessons.md

## G2-13-013-054  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Lesson.java:13-38` MySQL lesson int id, lesson_name,course_id,active,enabled,sequence,version,BaseModel is_deleted
- vNext now: `src/db/schema/courses.ts:320-367` Postgres course_lessons UUID,learning_path_id,name,description,sequence,status,visible_to_students; `drizzle/0004_courses_c2_learning.sql:15-25`
- Fix: Produce field-level legacy→vNext mapping including course ancestry and archived/deleted/visibility/version semantics

## G2-18-002-120  [P1] GAP  facet F22  effort M
- Legacy: Legacy uniqueness implemented by service case-insensitive name per course, sequence collision on updates. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LessonServiceImpl.java:120-127`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LessonServiceImpl.java:278-333`
- vNext now: vNext SQL unique active name and active sequence per learningPath. `src/db/schema/courses.ts:348-360`, `drizzle/0004_courses_c2_learning.sql:73-79`
- Fix: Reconcile course-wide vs path-wide uniqueness and sequence shape; avoid data loss if multiple offerings.
