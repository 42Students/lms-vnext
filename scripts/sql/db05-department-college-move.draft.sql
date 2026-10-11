-- DB-008 / Chat 6. UNREGISTERED UPSTREAM DEPARTMENT MOVE COMPANION.
-- DO NOT execute/register standalone. Chat 1 owns the numbered migration.
-- This is an additive companion to the CANONICAL
-- scripts/sql/db05-course-parent-graph-guard.draft.sql.
-- It deliberately DOES NOT create db05_course_parent_graph_guard, a second
-- courses trigger, parent_course_id, or a duplicate parent FK/index.
--
-- Source: courses.department_id -> departments.college_id.
-- The canonical guard inspects course parent/child/offerings on a course row
-- update. A direct change of departments.college_id otherwise changes college
-- ownership transitively without invoking the course-row guard.
--
-- Keep the SAME advisory key (605008001) and READ COMMITTED contract as the
-- canonical parent graph candidate; a separate per-college lock is UNSAFE
-- because it would not serialize with that guard's transactions.
-- This draft is fail-closed: a department with any course cannot change
-- college. Unused departments may be reassigned, subject to other policies.
BEGIN;

CREATE OR REPLACE FUNCTION db05_department_course_college_move_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $db05_department_college_guard$
BEGIN
  IF NEW.college_id IS NOT DISTINCT FROM OLD.college_id THEN
    RETURN NEW;
  END IF;

  IF current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION 'department college move requires read committed isolation pending concurrency proof'
      USING ERRCODE = '25001';
  END IF;

  -- Required to serialize with db05_course_parent_graph_guard().
  PERFORM pg_advisory_xact_lock(605008001::bigint);

  IF EXISTS (
    SELECT 1
      FROM courses course_row
     WHERE course_row.department_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'department with courses cannot move to another college'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$db05_department_college_guard$;

CREATE TRIGGER db05_department_course_college_before_move
BEFORE UPDATE OF college_id ON departments
FOR EACH ROW EXECUTE FUNCTION db05_department_course_college_move_guard();

COMMIT;

-- ACCEPTANCE: NONE EXECUTED.
-- 1. An unused department can move; a department with a root, parent or
--    child course cannot move even if course.parent_course_id is NULL.
-- 2. A second session inserting a course during a department reassignment
--    cannot produce an owner-college mismatch; deadlock/serialization retry
--    handling must be explicitly checked on disposable PostgreSQL.
-- 3. Under non-READ-COMMITTED isolation the attempted college move fails
--    pending a race proof, matching the canonical parent guard.
-- 4. Verify neighboring academic_period, offering, section and membership
--    reparenting pathways, which this narrow guard does NOT cover.
-- 5. Integrate exactly ONCE into the parent-facets + graph-guard migration
--    sequence; clean replay, rollback, live drift and race gates remain open.
