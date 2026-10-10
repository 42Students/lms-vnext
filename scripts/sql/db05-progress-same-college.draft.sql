-- DB-008 / CHAT 6. UNREGISTERED PROGRESS SAME-COLLEGE COMPANION.
-- DO NOT register/run independently in an existing production database.
-- W01 owns numbered migration integration after clean PG/negative tests.
-- Legacy oracle 42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5:
-- LearnerContentProgressRepository current-attempt reads and admin counters.
-- vNext path: learner_content_progress -> lesson_contents -> course_lessons
-- -> course_learning_paths -> course_offerings -> academic_periods.college_id;
-- course_offerings.course_id -> courses -> departments.college_id;
-- actor: learner_content_progress.membership_id -> college_memberships.college_id.
-- Optional lesson_contents.delivery_id must point to the SAME offering,
-- and that delivery's section period must belong to the same college.
--
-- This draft intentionally owns NO duplicate progress columns or indexes.
-- Merge into scripts/sql/db05-version-progress-attempts.draft.sql exactly
-- once during W01 integration. This child row trigger protects INSERT/UPDATE,
-- NOT upstream reparenting of membership, section, offering, academic period,
-- department, course, lesson or content; those require separate constraints.

BEGIN;

CREATE OR REPLACE FUNCTION db05_progress_same_college_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $db05_progress_college$
DECLARE
  content_period_college_id uuid;
  course_department_college_id uuid;
  author_membership_college_id uuid;
  content_offering_id uuid;
  scoped_delivery_id uuid;
  delivery_offering_id uuid;
  delivery_section_period_college_id uuid;
BEGIN
  SELECT ap.college_id,
         dep.college_id,
         offering.id,
         content.delivery_id,
         delivery.offering_id,
         section_period.college_id
    INTO content_period_college_id,
         course_department_college_id,
         content_offering_id,
         scoped_delivery_id,
         delivery_offering_id,
         delivery_section_period_college_id
  FROM lesson_contents content
  JOIN course_lessons lesson ON lesson.id = content.lesson_id
  JOIN course_learning_paths path ON path.id = lesson.learning_path_id
  JOIN course_offerings offering ON offering.id = path.offering_id
  JOIN academic_periods ap ON ap.id = offering.academic_period_id
  JOIN courses course_row ON course_row.id = offering.course_id
  JOIN departments dep ON dep.id = course_row.department_id
  LEFT JOIN course_section_deliveries delivery ON delivery.id = content.delivery_id
  LEFT JOIN sections section_row ON section_row.id = delivery.section_id
  LEFT JOIN academic_periods section_period ON section_period.id = section_row.academic_period_id
  WHERE content.id = NEW.lesson_content_id;

  SELECT cm.college_id INTO author_membership_college_id
  FROM college_memberships cm
  WHERE cm.id = NEW.membership_id;

  IF content_period_college_id IS NULL
     OR course_department_college_id IS NULL
     OR author_membership_college_id IS NULL
     OR content_period_college_id IS DISTINCT FROM course_department_college_id
     OR content_period_college_id IS DISTINCT FROM author_membership_college_id
     OR (scoped_delivery_id IS NOT NULL AND
         (delivery_offering_id IS NULL
          OR delivery_offering_id IS DISTINCT FROM content_offering_id
          OR delivery_section_period_college_id IS DISTINCT FROM content_period_college_id)) THEN
    RAISE EXCEPTION 'learner progress violates college or delivery boundary'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$db05_progress_college$;

CREATE TRIGGER db05_progress_same_college_before_write
BEFORE INSERT OR UPDATE OF membership_id, lesson_content_id
ON learner_content_progress
FOR EACH ROW EXECUTE FUNCTION db05_progress_same_college_guard();

COMMIT;

-- REQUIRED but NOT EXECUTED:
-- 1. Valid membership/content/course/period same-college row succeeds.
-- 2. Wrong-college membership rejected with 23514.
-- 3. Course department college mismatched against offering period -> 23514.
-- 4. Content's optional delivery points to different offering -> 23514.
-- 5. Optional delivery section period cross-college -> 23514.
-- 6. Malformed/missing content or membership does not pass (FK/guard).
-- 7. Subsequent upstream reparenting cannot make existing rows cross-tenant;
--    child trigger alone is insufficient. Include race tests/parent locks.
-- 8. Current-attempt-first soft-delete counting, rewatch and first completion
--    history preserved in API/DB regression tests.
-- 9. Migrate once only with version/progress attempt draft; single-writer W01.
