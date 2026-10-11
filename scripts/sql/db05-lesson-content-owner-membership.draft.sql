-- Chat 6 DB-008. UNREGISTERED DB05 owner/scope companion, NOT a new
-- numbered migration. W01 owns migration journal and Drizzle schema barrel.
-- Zero PostgreSQL execution, API test or CI evidence.
--
-- Legacy LessonContents.faculty_id is nullable owner/attribution, DISTINCT
-- from the user who created the record. Legacy LessonContentsServiceImpl:
-- - faculty create stamps facultyId from authenticated principal
-- - owner mismatch on update/delete requires admin role, including faculty
--   type ADMIN (and separately validates teaching assignment for generic
--   unowned content; any-college faculty is NOT enough).
-- VNext lesson_contents.created_by_user_id is immutable attribution, NOT
-- content owner. In multi-college membership system, store nullable owner
-- membership ID rather than trusting legacy numeric/global faculty id.
-- Old owner removed from college should not erase authored history; decide
-- how authorizations work after suspension separately.
--
-- It is NOT enough to FK to college_memberships alone. This trigger asserts
-- owner membership college matches course department, offering academic
-- period and optional section delivery's college/cohort/period.
--
-- IMPORTANT: Guard only validates child INSERT/UPDATE. Upstream college/
-- department/offering/period/section/membership mutation can strand ownership;
-- W01 must ensure immutability or companion revalidation.
BEGIN;

ALTER TABLE lesson_contents
  ADD COLUMN IF NOT EXISTS owner_membership_id uuid
    REFERENCES college_memberships(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS db05_lesson_contents_owner_idx
  ON lesson_contents (owner_membership_id)
  WHERE owner_membership_id IS NOT NULL;

CREATE OR REPLACE FUNCTION db05_lesson_content_owner_college_guard()
RETURNS trigger LANGUAGE plpgsql AS $db05_owner_scope$
DECLARE
  department_college_id uuid;
  offering_college_id uuid;
  owning_offering_id uuid;
  owning_cohort_id uuid;
  owning_period_id uuid;
  owner_college_id uuid;
  delivery_offering_id uuid;
  section_college_id uuid;
  section_cohort_id uuid;
  section_period_id uuid;
BEGIN
  IF NEW.owner_membership_id IS NULL THEN
    RETURN NEW; -- Generic unowned lesson content is legal, not editable by any faculty.
  END IF;

  SELECT dept.college_id, period.college_id, offering.id,
         offering.cohort_id, offering.academic_period_id
    INTO department_college_id, offering_college_id,
         owning_offering_id, owning_cohort_id, owning_period_id
    FROM course_lessons lesson
    JOIN course_learning_paths path ON path.id = lesson.learning_path_id
    JOIN course_offerings offering ON offering.id = path.offering_id
    JOIN courses course_row ON course_row.id = offering.course_id
    JOIN departments dept ON dept.id = course_row.department_id
    JOIN academic_periods period ON period.id = offering.academic_period_id
   WHERE lesson.id = NEW.lesson_id;

  SELECT cm.college_id INTO owner_college_id
    FROM college_memberships cm
   WHERE cm.id = NEW.owner_membership_id;

  IF owner_college_id IS NULL OR department_college_id IS NULL
     OR offering_college_id IS NULL
     OR owner_college_id IS DISTINCT FROM department_college_id
     OR owner_college_id IS DISTINCT FROM offering_college_id THEN
    RAISE EXCEPTION 'lesson content owner membership college does not match course scope'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.delivery_id IS NOT NULL THEN
    SELECT delivery.offering_id, section_row.cohort_id,
           section_row.academic_period_id, section_period.college_id
      INTO delivery_offering_id, section_cohort_id,
           section_period_id, section_college_id
      FROM course_section_deliveries delivery
      JOIN sections section_row ON section_row.id = delivery.section_id
      JOIN academic_periods section_period
        ON section_period.id = section_row.academic_period_id
     WHERE delivery.id = NEW.delivery_id;

    IF delivery_offering_id IS NULL OR section_college_id IS NULL
       OR delivery_offering_id IS DISTINCT FROM owning_offering_id
       OR section_college_id IS DISTINCT FROM owner_college_id
       OR section_cohort_id IS DISTINCT FROM owning_cohort_id
       OR section_period_id IS DISTINCT FROM owning_period_id THEN
      RAISE EXCEPTION 'lesson content owner has mismatched section delivery scope'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$db05_owner_scope$;

CREATE TRIGGER db05_lesson_content_owner_college_before_write
BEFORE INSERT OR UPDATE OF owner_membership_id, lesson_id, delivery_id
ON lesson_contents
FOR EACH ROW EXECUTE FUNCTION db05_lesson_content_owner_college_guard();

COMMIT;

-- UNEXECUTED acceptance:
-- 1. Owner membership from course college accepted; cross-college rejected.
-- 2. Valid unowned generic content accepted, but mutation requires assigned
--    teaching scope OR admin permission; database alone cannot prove role.
-- 3. Admin-created content can have distinct created_by_user_id and nullable
--    owner_membership_id; no aliasing or automatic overwrite.
-- 4. Optional delivery must belong to same offering/period/cohort/college.
-- 5. Hard-delete of owner membership cannot erase content attribution.
-- 6. Upstream department/period/cohort/membership/lesson/content reparent
--    checked under two-session concurrency; child trigger insufficient.
-- 7. Existing source legacy file receipt and all tenant rules still apply.
-- 8. PostgreSQL clean replay, rollback, 23514 negatives and API authorization
--    tests required before owner-aware features become runtime enabled.
