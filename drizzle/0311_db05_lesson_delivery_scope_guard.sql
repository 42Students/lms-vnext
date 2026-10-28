-- DB-008 accepted base lesson-content delivery path invariant:
-- Content lesson offering, optional exact delivery, cohort, period and tenant.
-- This single SQL guard is promoted from the existing DB05 companion, not
-- a new column set or duplicate content-order migration.
CREATE OR REPLACE FUNCTION db05_lesson_content_delivery_scope_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $db05_lesson_content_scope$
DECLARE
  owning_offering_id uuid;
  owning_cohort_id uuid;
  owning_period_id uuid;
  offering_college_id uuid;
  course_college_id uuid;
  scoped_delivery_offering_id uuid;
  scoped_section_cohort_id uuid;
  scoped_section_period_id uuid;
  scoped_section_college_id uuid;
BEGIN
  IF current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION 'lesson content scope write requires read committed isolation pending concurrency proof'
      USING ERRCODE = '25001';
  END IF;
  PERFORM pg_advisory_xact_lock(605008003::bigint);

  SELECT offering.id, offering.cohort_id, offering.academic_period_id,
         period.college_id, department.college_id
    INTO owning_offering_id, owning_cohort_id, owning_period_id,
         offering_college_id, course_college_id
  FROM course_lessons lesson
  JOIN course_learning_paths path ON path.id = lesson.learning_path_id
  JOIN course_offerings offering ON offering.id = path.offering_id
  JOIN academic_periods period ON period.id = offering.academic_period_id
  JOIN courses course_row ON course_row.id = offering.course_id
  JOIN departments department ON department.id = course_row.department_id
  WHERE lesson.id = NEW.lesson_id;

  IF owning_offering_id IS NULL OR offering_college_id IS NULL
     OR course_college_id IS NULL
     OR offering_college_id IS DISTINCT FROM course_college_id THEN
    RAISE EXCEPTION 'lesson content owning offering violates college scope'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.delivery_id IS NOT NULL THEN
    SELECT delivery.offering_id, section_row.cohort_id,
           section_row.academic_period_id, section_period.college_id
      INTO scoped_delivery_offering_id, scoped_section_cohort_id,
           scoped_section_period_id, scoped_section_college_id
    FROM course_section_deliveries delivery
    JOIN sections section_row ON section_row.id = delivery.section_id
    JOIN academic_periods section_period
      ON section_period.id = section_row.academic_period_id
    WHERE delivery.id = NEW.delivery_id;

    IF scoped_delivery_offering_id IS NULL
       OR scoped_section_college_id IS NULL
       OR scoped_delivery_offering_id IS DISTINCT FROM owning_offering_id
       OR scoped_section_cohort_id IS DISTINCT FROM owning_cohort_id
       OR scoped_section_period_id IS DISTINCT FROM owning_period_id
       OR scoped_section_college_id IS DISTINCT FROM offering_college_id THEN
      RAISE EXCEPTION 'lesson content delivery violates offering cohort period or college scope'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$db05_lesson_content_scope$;
--> statement-breakpoint
CREATE TRIGGER db05_lesson_content_delivery_scope_before_write
BEFORE INSERT OR UPDATE OF lesson_id, delivery_id
ON lesson_contents
FOR EACH ROW EXECUTE FUNCTION db05_lesson_content_delivery_scope_guard();
