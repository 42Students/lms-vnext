-- DB-008 / CHAT 6 / DATABASE. SOURCE-ONLY, UNREGISTERED SQL COMPANION.
-- NOT a numbered migration. Chat 1 owns integration and PostgreSQL replay.
-- Companion to:
--   db05-classroom-message-history.draft.sql (ONE owner of history columns),
--   db05-classroom-chat-parity.draft.sql (child write boundary).
--
-- Existing child INSERT/UPDATE guard cannot protect historical classroom
-- messages when the delivery/course/college/membership graph is mutated later.
-- This conservative candidate forbids silent ancestry reassignment whenever
-- any retained message depends on the old parent. It does not disable normal
-- course lifecycle status updates, student profile name changes or archival.
--
-- READ COMMITTED + DB05 advisory key 605008003 shared with message writer,
-- offering/delivery and authored-content guardians. No independent guarantee:
-- PostgreSQL two-session concurrency/deadlock acceptance remains REQUIRED.
-- Trigger install order and other DB02/DB05 guards must be coordinated once.
BEGIN;

CREATE OR REPLACE FUNCTION db05_classroom_message_ancestor_retention_guard()
RETURNS trigger LANGUAGE plpgsql
AS $db05_classroom_ancestor$
DECLARE
  has_messages boolean := false;
  is_changing boolean := false;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME <> 'course_section_deliveries' THEN
      RAISE EXCEPTION 'DB05 unexpected classroom ancestry delete table'
        USING ERRCODE = '23514';
    END IF;
    is_changing := true;
  ELSIF TG_TABLE_NAME = 'course_section_deliveries' THEN
    is_changing := NEW.offering_id IS DISTINCT FROM OLD.offering_id
               OR NEW.section_id IS DISTINCT FROM OLD.section_id;
  ELSIF TG_TABLE_NAME = 'course_offerings' THEN
    is_changing := NEW.course_id IS DISTINCT FROM OLD.course_id
               OR NEW.cohort_id IS DISTINCT FROM OLD.cohort_id
               OR NEW.academic_period_id IS DISTINCT FROM OLD.academic_period_id;
  ELSIF TG_TABLE_NAME = 'sections' THEN
    is_changing := NEW.cohort_id IS DISTINCT FROM OLD.cohort_id
               OR NEW.academic_period_id IS DISTINCT FROM OLD.academic_period_id;
  ELSIF TG_TABLE_NAME = 'courses' THEN
    is_changing := NEW.department_id IS DISTINCT FROM OLD.department_id;
  ELSIF TG_TABLE_NAME = 'departments' THEN
    is_changing := NEW.college_id IS DISTINCT FROM OLD.college_id;
  ELSIF TG_TABLE_NAME = 'academic_periods' THEN
    is_changing := NEW.college_id IS DISTINCT FROM OLD.college_id;
  ELSIF TG_TABLE_NAME = 'cohorts' THEN
    is_changing := NEW.program_id IS DISTINCT FROM OLD.program_id;
  ELSIF TG_TABLE_NAME = 'programs' THEN
    is_changing := NEW.department_id IS DISTINCT FROM OLD.department_id;
  ELSIF TG_TABLE_NAME = 'college_memberships' THEN
    -- The author membership is immutable for historical actor attribution;
    -- changing its user_id is unsafe even when college_id stays identical.
    is_changing := NEW.college_id IS DISTINCT FROM OLD.college_id
               OR NEW.user_id IS DISTINCT FROM OLD.user_id;
  ELSE
    RAISE EXCEPTION 'DB05 unexpected classroom ancestor: %', TG_TABLE_NAME
      USING ERRCODE = '23514';
  END IF;

  IF NOT is_changing THEN
    RETURN NEW;
  END IF;
  IF current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION 'DB05 classroom ancestor change requires READ COMMITTED'
      USING ERRCODE = '25001';
  END IF;

  -- This lock must be acquired before checking descendants. Child classroom
  -- message INSERT/scope UPDATE uses the SAME advisory key.
  PERFORM pg_advisory_xact_lock(605008003::bigint);

  IF TG_TABLE_NAME = 'course_section_deliveries' THEN
    SELECT EXISTS (
      SELECT 1 FROM course_discussion_messages message
      WHERE message.delivery_id = OLD.id
    ) INTO has_messages;

  ELSIF TG_TABLE_NAME = 'course_offerings' THEN
    SELECT EXISTS (
      SELECT 1 FROM course_discussion_messages message
      JOIN course_section_deliveries delivery ON delivery.id = message.delivery_id
      WHERE delivery.offering_id = OLD.id
    ) INTO has_messages;

  ELSIF TG_TABLE_NAME = 'sections' THEN
    SELECT EXISTS (
      SELECT 1 FROM course_discussion_messages message
      JOIN course_section_deliveries delivery ON delivery.id = message.delivery_id
      WHERE delivery.section_id = OLD.id
    ) INTO has_messages;

  ELSIF TG_TABLE_NAME = 'courses' THEN
    SELECT EXISTS (
      SELECT 1 FROM course_discussion_messages message
      JOIN course_section_deliveries delivery ON delivery.id = message.delivery_id
      JOIN course_offerings offering ON offering.id = delivery.offering_id
      WHERE offering.course_id = OLD.id
    ) INTO has_messages;

  ELSIF TG_TABLE_NAME = 'departments' THEN
    SELECT EXISTS (
      SELECT 1 FROM course_discussion_messages message
      JOIN course_section_deliveries delivery ON delivery.id = message.delivery_id
      JOIN course_offerings offering ON offering.id = delivery.offering_id
      JOIN courses course_row ON course_row.id = offering.course_id
      WHERE course_row.department_id = OLD.id
    ) OR EXISTS (
      SELECT 1 FROM course_discussion_messages message
      JOIN course_section_deliveries delivery ON delivery.id = message.delivery_id
      JOIN sections section_row ON section_row.id = delivery.section_id
      JOIN cohorts cohort ON cohort.id = section_row.cohort_id
      JOIN programs program_row ON program_row.id = cohort.program_id
      WHERE program_row.department_id = OLD.id
    ) INTO has_messages;

  ELSIF TG_TABLE_NAME = 'academic_periods' THEN
    SELECT EXISTS (
      SELECT 1 FROM course_discussion_messages message
      JOIN course_section_deliveries delivery ON delivery.id = message.delivery_id
      JOIN course_offerings offering ON offering.id = delivery.offering_id
      WHERE offering.academic_period_id = OLD.id
    ) OR EXISTS (
      SELECT 1 FROM course_discussion_messages message
      JOIN course_section_deliveries delivery ON delivery.id = message.delivery_id
      JOIN sections section_row ON section_row.id = delivery.section_id
      WHERE section_row.academic_period_id = OLD.id
    ) INTO has_messages;

  ELSIF TG_TABLE_NAME = 'cohorts' THEN
    SELECT EXISTS (
      SELECT 1 FROM course_discussion_messages message
      JOIN course_section_deliveries delivery ON delivery.id = message.delivery_id
      JOIN course_offerings offering ON offering.id = delivery.offering_id
      WHERE offering.cohort_id = OLD.id
    ) OR EXISTS (
      SELECT 1 FROM course_discussion_messages message
      JOIN course_section_deliveries delivery ON delivery.id = message.delivery_id
      JOIN sections section_row ON section_row.id = delivery.section_id
      WHERE section_row.cohort_id = OLD.id
    ) INTO has_messages;

  ELSIF TG_TABLE_NAME = 'programs' THEN
    SELECT EXISTS (
      SELECT 1 FROM course_discussion_messages message
      JOIN course_section_deliveries delivery ON delivery.id = message.delivery_id
      JOIN sections section_row ON section_row.id = delivery.section_id
      JOIN cohorts cohort ON cohort.id = section_row.cohort_id
      WHERE cohort.program_id = OLD.id
    ) INTO has_messages;

  ELSIF TG_TABLE_NAME = 'college_memberships' THEN
    SELECT EXISTS (
      SELECT 1 FROM course_discussion_messages message
      WHERE message.sender_membership_id = OLD.id
    ) INTO has_messages;
  END IF;

  IF has_messages THEN
    RAISE EXCEPTION 'DB05 classroom history forbids implicit scope/author reparent'
      USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$db05_classroom_ancestor$;

CREATE TRIGGER db05_classroom_delivery_reparent_guard
  BEFORE UPDATE OF offering_id, section_id ON course_section_deliveries
  FOR EACH ROW EXECUTE FUNCTION db05_classroom_message_ancestor_retention_guard();
CREATE TRIGGER db05_classroom_delivery_delete_guard
  BEFORE DELETE ON course_section_deliveries
  FOR EACH ROW EXECUTE FUNCTION db05_classroom_message_ancestor_retention_guard();
CREATE TRIGGER db05_classroom_offering_reparent_guard
  BEFORE UPDATE OF course_id, cohort_id, academic_period_id ON course_offerings
  FOR EACH ROW EXECUTE FUNCTION db05_classroom_message_ancestor_retention_guard();
CREATE TRIGGER db05_classroom_section_reparent_guard
  BEFORE UPDATE OF cohort_id, academic_period_id ON sections
  FOR EACH ROW EXECUTE FUNCTION db05_classroom_message_ancestor_retention_guard();
CREATE TRIGGER db05_classroom_course_reparent_guard
  BEFORE UPDATE OF department_id ON courses
  FOR EACH ROW EXECUTE FUNCTION db05_classroom_message_ancestor_retention_guard();
CREATE TRIGGER db05_classroom_department_reparent_guard
  BEFORE UPDATE OF college_id ON departments
  FOR EACH ROW EXECUTE FUNCTION db05_classroom_message_ancestor_retention_guard();
CREATE TRIGGER db05_classroom_period_reparent_guard
  BEFORE UPDATE OF college_id ON academic_periods
  FOR EACH ROW EXECUTE FUNCTION db05_classroom_message_ancestor_retention_guard();
CREATE TRIGGER db05_classroom_cohort_reparent_guard
  BEFORE UPDATE OF program_id ON cohorts
  FOR EACH ROW EXECUTE FUNCTION db05_classroom_message_ancestor_retention_guard();
CREATE TRIGGER db05_classroom_program_reparent_guard
  BEFORE UPDATE OF department_id ON programs
  FOR EACH ROW EXECUTE FUNCTION db05_classroom_message_ancestor_retention_guard();
CREATE TRIGGER db05_classroom_sender_membership_move_guard
  BEFORE UPDATE OF college_id, user_id ON college_memberships
  FOR EACH ROW EXECUTE FUNCTION db05_classroom_message_ancestor_retention_guard();

COMMIT;

-- CL-01..CL-18 TWO-SESSION / DISPOSABLE POSTGRES ACCEPTANCE; NONE RUN.
-- CL-01 Valid message + unchanged ancestor UPDATE -> ALLOW.
-- CL-02 No messages attached + reparent -> ALLOW if other DB02 rules allow.
-- CL-03 Delivery offering move carrying one message -> reject 23514.
-- CL-04 Delivery section move carrying one message -> reject 23514.
-- CL-05 Delivery deletion carrying message (even soft deleted) -> reject 23514.
-- CL-06 Offering course move with delivery message -> reject 23514.
-- CL-07 Offering cohort/period change with message -> reject 23514.
-- CL-08 Section cohort/period change with message -> reject 23514.
-- CL-09 Course department change with message -> reject 23514.
-- CL-10 Course department and section program dept both protect college move.
-- CL-11 Offering or section academic-period college change -> reject.
-- CL-12 Cohort program reassignment with message -> reject.
-- CL-13 Section program department reassignment with message -> reject.
-- CL-14 Membership college OR user ID reparent with message -> reject.
-- CL-15 All queries include deleted history, not only active messages.
-- CL-16 Non READ COMMITTED ancestor mutation -> reject 25001.
-- CL-17 Concurrent message INSERT vs ancestor move serializes; never
--       leaves a message with changed college/cohort/period context.
-- CL-18 Validate lock ordering/deadlock with DB02/DB05 guardians and FK
--       locks, clean replay, rollback and trigger-name uniqueness.
