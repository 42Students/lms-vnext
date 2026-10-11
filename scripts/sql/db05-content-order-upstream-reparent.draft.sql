-- DB05 / Chat 6 / DB-008 DATABASE, UNREGISTERED COMPANION ONLY.
-- DO NOT RUN AGAINST PRODUCTION; Chat 1 owns migration registration.
-- Must merge only AFTER:
--   docs/planning/sql/db05-lesson-content-delivery-order-candidate.sql,
--   scripts/sql/db05-content-delivery-order-scope.draft.sql,
--   scripts/sql/db05-content-delivery-order-unique.draft.sql.
-- This draft stages upstream immutability guards, not a separate eighth DB05
-- migration. No PostgreSQL or race acceptance has been run.
--
-- PROBLEM: scope guard on the order override row fires only when an override
-- itself is written. Reparenting its ancestor can silently invalidate tenant,
-- course offering or lesson ordering with NO child-table trigger firing.
--
-- The candidate below prevents changes to key ancestry while order override
-- rows exist. It intentionally rejects changes rather than silently cascading
-- old overrides into a different course/class scope. Clear overrides through
-- an authorized complete order reset before reparenting.
--
-- Concurrency: use SAME advisory key as the child order scope guard.
-- Child guard must acquire 605008003 BEFORE its first relationship query.
-- Under READ COMMITTED each guard re-reads current state after the lock.
-- This does not by itself cover academic_periods.college_id, department
-- ownership, deletion, or direct manipulation that bypasses triggers.
-- PG deadlock/race and upstream policy acceptance is still REQUIRED.

BEGIN;

CREATE OR REPLACE FUNCTION db05_content_order_upstream_reparent_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $db05_content_order_upstream$
DECLARE
  has_order_rows boolean := false;
BEGIN
  IF current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION 'content order ancestor reparent requires read committed isolation pending proof'
      USING ERRCODE = '25001';
  END IF;

  -- This lock is shared with db05_content_delivery_order_scope_guard.
  PERFORM pg_advisory_xact_lock(605008003::bigint);

  IF TG_TABLE_NAME = 'lesson_contents' THEN
    IF NEW.lesson_id IS DISTINCT FROM OLD.lesson_id
       OR NEW.delivery_id IS DISTINCT FROM OLD.delivery_id
       OR (NEW.status::text = 'ARCHIVED' AND OLD.status::text <> 'ARCHIVED') THEN
      SELECT EXISTS (
        SELECT 1
        FROM lesson_content_delivery_sequences order_row
        WHERE order_row.lesson_content_id = OLD.id
      ) INTO has_order_rows;
    END IF;

  ELSIF TG_TABLE_NAME = 'course_lessons' THEN
    IF NEW.learning_path_id IS DISTINCT FROM OLD.learning_path_id THEN
      SELECT EXISTS (
        SELECT 1
        FROM lesson_contents content
        JOIN lesson_content_delivery_sequences order_row
          ON order_row.lesson_content_id = content.id
        WHERE content.lesson_id = OLD.id
      ) INTO has_order_rows;
    END IF;

  ELSIF TG_TABLE_NAME = 'course_learning_paths' THEN
    IF NEW.offering_id IS DISTINCT FROM OLD.offering_id THEN
      SELECT EXISTS (
        SELECT 1
        FROM course_lessons lesson
        JOIN lesson_contents content ON content.lesson_id = lesson.id
        JOIN lesson_content_delivery_sequences order_row
          ON order_row.lesson_content_id = content.id
        WHERE lesson.learning_path_id = OLD.id
      ) INTO has_order_rows;
    END IF;

  ELSIF TG_TABLE_NAME = 'course_section_deliveries' THEN
    IF NEW.offering_id IS DISTINCT FROM OLD.offering_id
       OR NEW.section_id IS DISTINCT FROM OLD.section_id THEN
      SELECT EXISTS (
        SELECT 1
        FROM lesson_content_delivery_sequences order_row
        WHERE order_row.delivery_id = OLD.id
      ) INTO has_order_rows;
    END IF;

  ELSIF TG_TABLE_NAME = 'course_offerings' THEN
    IF NEW.course_id IS DISTINCT FROM OLD.course_id
       OR NEW.cohort_id IS DISTINCT FROM OLD.cohort_id
       OR NEW.academic_period_id IS DISTINCT FROM OLD.academic_period_id THEN
      SELECT EXISTS (
        SELECT 1
        FROM course_learning_paths path
        JOIN course_lessons lesson ON lesson.learning_path_id = path.id
        JOIN lesson_contents content ON content.lesson_id = lesson.id
        JOIN lesson_content_delivery_sequences order_row
          ON order_row.lesson_content_id = content.id
        WHERE path.offering_id = OLD.id
      ) INTO has_order_rows;

      IF NOT has_order_rows THEN
        SELECT EXISTS (
          SELECT 1
          FROM course_section_deliveries delivery
          JOIN lesson_content_delivery_sequences order_row
            ON order_row.delivery_id = delivery.id
          WHERE delivery.offering_id = OLD.id
        ) INTO has_order_rows;
      END IF;
    END IF;

  ELSIF TG_TABLE_NAME = 'sections' THEN
    IF NEW.cohort_id IS DISTINCT FROM OLD.cohort_id
       OR NEW.academic_period_id IS DISTINCT FROM OLD.academic_period_id THEN
      SELECT EXISTS (
        SELECT 1
        FROM course_section_deliveries delivery
        JOIN lesson_content_delivery_sequences order_row
          ON order_row.delivery_id = delivery.id
        WHERE delivery.section_id = OLD.id
      ) INTO has_order_rows;
    END IF;

  ELSE
    RAISE EXCEPTION 'unsupported DB05 content order ancestry table: %', TG_TABLE_NAME
      USING ERRCODE = '23514';
  END IF;

  IF has_order_rows THEN
    RAISE EXCEPTION 'content delivery order overrides must be cleared before scope reparent'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$db05_content_order_upstream$;

-- All six triggers share one function and do not modify the base schema.
CREATE TRIGGER db05_order_content_parent_before_move
BEFORE UPDATE OF lesson_id, delivery_id, status
ON lesson_contents
FOR EACH ROW EXECUTE FUNCTION db05_content_order_upstream_reparent_guard();

CREATE TRIGGER db05_order_lesson_parent_before_move
BEFORE UPDATE OF learning_path_id
ON course_lessons
FOR EACH ROW EXECUTE FUNCTION db05_content_order_upstream_reparent_guard();

CREATE TRIGGER db05_order_path_parent_before_move
BEFORE UPDATE OF offering_id
ON course_learning_paths
FOR EACH ROW EXECUTE FUNCTION db05_content_order_upstream_reparent_guard();

CREATE TRIGGER db05_order_delivery_parent_before_move
BEFORE UPDATE OF offering_id, section_id
ON course_section_deliveries
FOR EACH ROW EXECUTE FUNCTION db05_content_order_upstream_reparent_guard();

CREATE TRIGGER db05_order_offering_parent_before_move
BEFORE UPDATE OF course_id, cohort_id, academic_period_id
ON course_offerings
FOR EACH ROW EXECUTE FUNCTION db05_content_order_upstream_reparent_guard();

CREATE TRIGGER db05_order_section_parent_before_move
BEFORE UPDATE OF cohort_id, academic_period_id
ON sections
FOR EACH ROW EXECUTE FUNCTION db05_content_order_upstream_reparent_guard();

COMMIT;

-- MUST BE PROVED ON DISPOSABLE POSTGRES (NOT RUN):
-- (A) No overrides: each allowed parent scope update succeeds.
-- (B) With overrides: content delivery, lesson->path, path->offering,
--     delivery->section/offering, offering->course/cohort/period and
--     section->cohort/period updates fail with SQLSTATE 23514.
-- (C) Same-value updates succeed. Archiving content with overrides fails.
-- (D) Clearing overrides + approved reparent transaction succeeds.
-- (E) Child order write vs ancestor reparent on two sessions cannot commit
--     a mismatched scope. Validate isolation errors and deadlock retries.
-- (F) Non-READ-COMMITTED ancestor updates fail SQLSTATE 25001.
-- (G) Upstream department and academic_period.college_id edits remain
--     separately gated, as do DELETE CASCADE paths and author permissions.
-- (H) W01 folds this and child advisory lock into one numbered migration,
--     no repeated trigger name or different advisory lock key.
