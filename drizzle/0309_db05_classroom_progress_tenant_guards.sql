-- DB-008: protect existing persisted progress and classroom messages from
-- wrong-college direct SQL, including independent parent FK paths.
-- Existing table/column definitions are in registered migrations; do not
-- duplicate them. This migration is fail-closed under non-READ-COMMITTED.
CREATE OR REPLACE FUNCTION db05_progress_course_college_guard()
RETURNS trigger LANGUAGE plpgsql AS $db05_progress_scope$
DECLARE
  actor_college_id uuid;
  department_college_id uuid;
  period_college_id uuid;
  offering_id uuid;
  delivery_id uuid;
  delivery_offering_id uuid;
  cohort_id uuid;
  period_id uuid;
  section_cohort_id uuid;
  section_period_id uuid;
BEGIN
  IF current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION 'progress writes require READ COMMITTED'
      USING ERRCODE = '25001';
  END IF;
  PERFORM pg_advisory_xact_lock(605008003::bigint);
  IF TG_OP = 'UPDATE' AND (
      NEW.membership_id IS DISTINCT FROM OLD.membership_id OR
      NEW.lesson_content_id IS DISTINCT FROM OLD.lesson_content_id OR
      NEW.attempt IS DISTINCT FROM OLD.attempt) THEN
    RAISE EXCEPTION 'progress ownership and attempt identity are immutable'
      USING ERRCODE = '23514';
  END IF;
  SELECT membership.college_id INTO actor_college_id
  FROM college_memberships membership WHERE membership.id=NEW.membership_id;
  SELECT department.college_id, period.college_id,
         offering.id, content.delivery_id, delivery.offering_id,
         offering.cohort_id, offering.academic_period_id,
         section_row.cohort_id, section_row.academic_period_id
  INTO department_college_id, period_college_id,
       offering_id, delivery_id, delivery_offering_id,
       cohort_id, period_id, section_cohort_id, section_period_id
  FROM lesson_contents content
  JOIN course_lessons lesson ON lesson.id=content.lesson_id
  JOIN course_learning_paths path ON path.id=lesson.learning_path_id
  JOIN course_offerings offering ON offering.id=path.offering_id
  JOIN academic_periods period ON period.id=offering.academic_period_id
  JOIN courses course_row ON course_row.id=offering.course_id
  JOIN departments department ON department.id=course_row.department_id
  LEFT JOIN course_section_deliveries delivery ON delivery.id=content.delivery_id
  LEFT JOIN sections section_row ON section_row.id=delivery.section_id
  WHERE content.id=NEW.lesson_content_id;
  IF actor_college_id IS NULL OR department_college_id IS NULL
     OR actor_college_id IS DISTINCT FROM department_college_id
     OR period_college_id IS DISTINCT FROM department_college_id
     OR (delivery_id IS NOT NULL AND (
        delivery_offering_id IS DISTINCT FROM offering_id
        OR section_cohort_id IS DISTINCT FROM cohort_id
        OR section_period_id IS DISTINCT FROM period_id
     )) THEN
    RAISE EXCEPTION 'progress membership and content are in different college/offering scopes'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$db05_progress_scope$;
--> statement-breakpoint
CREATE TRIGGER db05_progress_college_before_write
 BEFORE INSERT OR UPDATE ON learner_content_progress
 FOR EACH ROW EXECUTE FUNCTION db05_progress_course_college_guard();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION db05_class_chat_course_college_guard()
RETURNS trigger LANGUAGE plpgsql AS $db05_chat_scope$
DECLARE
  sender_college_id uuid;
  department_college_id uuid;
  period_college_id uuid;
  section_period_college_id uuid;
  program_college_id uuid;
  offering_id uuid;
  delivery_offering_id uuid;
  cohort_id uuid;
  period_id uuid;
  section_cohort_id uuid;
  section_period_id uuid;
  related_content_offering_id uuid;
BEGIN
  IF current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION 'classroom writes require READ COMMITTED'
      USING ERRCODE = '25001';
  END IF;
  PERFORM pg_advisory_xact_lock(605008003::bigint);
  IF TG_OP = 'UPDATE' AND (
     NEW.delivery_id IS DISTINCT FROM OLD.delivery_id OR
     NEW.lesson_content_id IS DISTINCT FROM OLD.lesson_content_id) THEN
    RAISE EXCEPTION 'classroom message delivery and content scope are immutable'
      USING ERRCODE = '23514';
  END IF;
  SELECT membership.college_id INTO sender_college_id
  FROM college_memberships membership WHERE membership.id=NEW.sender_membership_id;
  SELECT department.college_id, period.college_id, section_period.college_id,
         program_department.college_id,
         offering.id, delivery.offering_id, offering.cohort_id,
         offering.academic_period_id, section_row.cohort_id,
         section_row.academic_period_id
  INTO department_college_id, period_college_id, section_period_college_id,
       program_college_id,
       offering_id, delivery_offering_id, cohort_id,
       period_id, section_cohort_id, section_period_id
  FROM course_section_deliveries delivery
  JOIN course_offerings offering ON offering.id=delivery.offering_id
  JOIN courses course_row ON course_row.id=offering.course_id
  JOIN departments department ON department.id=course_row.department_id
  JOIN academic_periods period ON period.id=offering.academic_period_id
  JOIN sections section_row ON section_row.id=delivery.section_id
  JOIN academic_periods section_period ON section_period.id=section_row.academic_period_id
  JOIN cohorts cohort ON cohort.id=section_row.cohort_id
  JOIN programs program ON program.id=cohort.program_id
  JOIN departments program_department ON program_department.id=program.department_id
  WHERE delivery.id=NEW.delivery_id;
  IF sender_college_id IS NULL OR department_college_id IS NULL
    OR period_college_id IS DISTINCT FROM department_college_id
    OR section_period_college_id IS DISTINCT FROM department_college_id
    OR program_college_id IS DISTINCT FROM department_college_id
    OR sender_college_id IS DISTINCT FROM department_college_id
    OR delivery_offering_id IS DISTINCT FROM offering_id
    OR cohort_id IS DISTINCT FROM section_cohort_id
    OR period_id IS DISTINCT FROM section_period_id THEN
    RAISE EXCEPTION 'classroom message violates college/cohort/period scope'
      USING ERRCODE = '23514';
  END IF;
  IF NEW.lesson_content_id IS NOT NULL THEN
    SELECT path.offering_id INTO related_content_offering_id
    FROM lesson_contents content
    JOIN course_lessons lesson ON lesson.id=content.lesson_id
    JOIN course_learning_paths path ON path.id=lesson.learning_path_id
    WHERE content.id=NEW.lesson_content_id;
    IF related_content_offering_id IS DISTINCT FROM offering_id THEN
      RAISE EXCEPTION 'classroom reply belongs to a different course offering'
        USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$db05_chat_scope$;
--> statement-breakpoint
CREATE TRIGGER db05_class_chat_college_before_write
 BEFORE INSERT OR UPDATE OF delivery_id, sender_membership_id, lesson_content_id
 ON course_discussion_messages
 FOR EACH ROW EXECUTE FUNCTION db05_class_chat_course_college_guard();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION db05_progress_content_reparent_guard()
RETURNS trigger LANGUAGE plpgsql AS $db05_progress_reparent$
BEGIN
  IF EXISTS(
    SELECT 1 FROM learner_content_progress
    WHERE lesson_content_id=OLD.id
  ) THEN
    RAISE EXCEPTION 'cannot reparent content carrying learner progress'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$db05_progress_reparent$;
--> statement-breakpoint
CREATE TRIGGER db05_progress_content_reparent_before_write
 BEFORE UPDATE OF lesson_id,delivery_id ON lesson_contents
 FOR EACH ROW WHEN (
    OLD.lesson_id IS DISTINCT FROM NEW.lesson_id OR
    OLD.delivery_id IS DISTINCT FROM NEW.delivery_id
 )
 EXECUTE FUNCTION db05_progress_content_reparent_guard();
