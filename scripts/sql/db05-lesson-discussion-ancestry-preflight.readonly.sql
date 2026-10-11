-- DB-008 / CHAT 6. READ-ONLY and source-only; this is NOT a migration.
-- Execute only on a disposable PostgreSQL with the staged discussion table.
-- Inspect aggregate counts only; do not expose author IDs or message contents.
-- A zero count is necessary but NOT sufficient for concurrent-write safety.
WITH RECURSIVE graph_walk(root_id, id, parent_id, visited, cycle) AS (
  SELECT id, id, parent_discussion_id, ARRAY[id], false
    FROM lesson_content_discussions
  UNION ALL
  SELECT ancestor.root_id, parent.id, parent.parent_discussion_id,
         ancestor.visited || parent.id,
         parent.id = ANY(ancestor.visited)
    FROM graph_walk ancestor
    JOIN lesson_content_discussions parent ON parent.id = ancestor.parent_id
   WHERE NOT ancestor.cycle
),
cycle_roots AS (
  SELECT DISTINCT root_id FROM graph_walk WHERE cycle
),
cross_content_parents AS (
  SELECT child.id
    FROM lesson_content_discussions child
    JOIN lesson_content_discussions parent
      ON parent.id = child.parent_discussion_id
   WHERE child.lesson_content_id IS DISTINCT FROM parent.lesson_content_id
),
author_college_mismatches AS (
  SELECT discussion.id
    FROM lesson_content_discussions discussion
    JOIN college_memberships author
      ON author.id = discussion.author_membership_id
   WHERE author.college_id IS DISTINCT FROM discussion.college_id
),
unresolvable_content_scope AS (
  SELECT discussion.id
    FROM lesson_content_discussions discussion
    LEFT JOIN lesson_contents content
      ON content.id = discussion.lesson_content_id
    LEFT JOIN course_lessons lesson ON lesson.id = content.lesson_id
    LEFT JOIN course_learning_paths path ON path.id = lesson.learning_path_id
    LEFT JOIN course_offerings offering ON offering.id = path.offering_id
    LEFT JOIN courses course_row ON course_row.id = offering.course_id
    LEFT JOIN departments department ON department.id = course_row.department_id
    LEFT JOIN academic_periods period ON period.id = offering.academic_period_id
   WHERE content.id IS NULL
      OR department.college_id IS DISTINCT FROM discussion.college_id
      OR period.college_id IS DISTINCT FROM discussion.college_id
)
SELECT 'DISCUSSION_PARENT_CYCLE' AS violation, count(*)::bigint AS offending_rows
  FROM cycle_roots
UNION ALL
SELECT 'CROSS_CONTENT_PARENT', count(*)::bigint FROM cross_content_parents
UNION ALL
SELECT 'CROSS_COLLEGE_AUTHOR', count(*)::bigint FROM author_college_mismatches
UNION ALL
SELECT 'UNRESOLVABLE_OR_CROSS_COLLEGE_CONTENT', count(*)::bigint
  FROM unresolvable_content_scope
ORDER BY violation;
