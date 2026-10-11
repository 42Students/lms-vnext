-- DB-008 / Chat 6: READ-ONLY, aggregate-only tombstone ancestor drift probe.
-- NOT a migration, NOT an executable production cleanup, NOT a permission grant.
-- Run only on approved DISPOSABLE PostgreSQL AFTER W01 has staged the
-- course/lesson/content legacy_deleted_at columns and BEFORE activation.
-- Zero violations are necessary but not sufficient: this query cannot prove
-- concurrent INSERT/RESTORE vs DELETE races or transaction lock ordering.
-- No person identifiers, course identifiers or private content are projected.
SELECT 'LIVE_LESSON_UNDER_DELETED_COURSE' AS violation,
       count(*)::bigint AS offending_rows
  FROM course_lessons lesson
  JOIN course_learning_paths path ON path.id = lesson.learning_path_id
  JOIN course_offerings offering ON offering.id = path.offering_id
  JOIN courses course_row ON course_row.id = offering.course_id
 WHERE lesson.legacy_deleted_at IS NULL
   AND course_row.legacy_deleted_at IS NOT NULL
UNION ALL
SELECT 'LIVE_CONTENT_UNDER_DELETED_LESSON', count(*)::bigint
  FROM lesson_contents content
  JOIN course_lessons lesson ON lesson.id = content.lesson_id
 WHERE content.legacy_deleted_at IS NULL
   AND lesson.legacy_deleted_at IS NOT NULL
UNION ALL
SELECT 'LIVE_CONTENT_UNDER_DELETED_COURSE', count(*)::bigint
  FROM lesson_contents content
  JOIN course_lessons lesson ON lesson.id = content.lesson_id
  JOIN course_learning_paths path ON path.id = lesson.learning_path_id
  JOIN course_offerings offering ON offering.id = path.offering_id
  JOIN courses course_row ON course_row.id = offering.course_id
 WHERE content.legacy_deleted_at IS NULL
   AND course_row.legacy_deleted_at IS NOT NULL
ORDER BY violation;
