-- DB-008 / Chat 6. SOURCE-BACKED COURSE PARENT INTEGRITY CANDIDATE.
-- UNREGISTERED DRAFT: do not run in production or concatenate blindly with
-- scripts/sql/db05-course-parent-facets.draft.sql.
-- Chat 1 owns numbered Drizzle migrations, schema index, final integration.
--
-- Source: Course.java parent_course_id, dept_id; CourseDTO.java boxed
-- parentCourseId; CourseServiceImpl.setCourseFields null=preserve, <=0=clear.
-- vNext: courses.department_id -> departments.college_id.
-- Problem: a self-reference FK and parent<>id alone allow two+ node cycles,
-- parent links across colleges, and upstream department->college moves.
--
-- SERIALIZATION CONTRACT:
-- All participating course-parent writes lock the same advisory key per college
-- before they inspect the lineage. For cross-college department changes lock
-- the two keys in deterministic order. This protects READ COMMITTED parent
-- writes from A->B/B->A write skew, subject to executed race verification.
-- Non-READ-COMMITTED workloads need explicit SERIALIZABLE acceptance/retry;
-- do not claim the guard is verified until concurrent tests pass.
-- Departments are prohibited from changing college_id while ANY course
-- references them; this prevents an upstream move bypassing the row guard.
-- Advisory locks are transactional and do not confer application permission.
BEGIN;

CREATE OR REPLACE FUNCTION db05_course_parent_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $db05_course_parent$
DECLARE
  proposed_college_id uuid;
  previous_college_id uuid;
  parent_college_id uuid;
  proposed_lock_key bigint;
  previous_lock_key bigint;
  invalid_ancestry boolean;
BEGIN
  SELECT department.college_id
    INTO proposed_college_id
    FROM departments department
   WHERE department.id = NEW.department_id;

  IF proposed_college_id IS NULL THEN
    RAISE EXCEPTION 'course department must resolve to a college'
      USING ERRCODE = '23514';
  END IF;

  proposed_lock_key := hashtextextended(
    'db05_course_parent_college:' || proposed_college_id::text, 0
  );

  IF TG_OP = 'UPDATE' THEN
    SELECT department.college_id
      INTO previous_college_id
      FROM departments department
     WHERE department.id = OLD.department_id;
  END IF;

  IF previous_college_id IS NOT NULL
     AND previous_college_id IS DISTINCT FROM proposed_college_id THEN
    previous_lock_key := hashtextextended(
      'db05_course_parent_college:' || previous_college_id::text, 0
    );
    PERFORM pg_advisory_xact_lock(
      LEAST(previous_lock_key, proposed_lock_key)
    );
    PERFORM pg_advisory_xact_lock(
      GREATEST(previous_lock_key, proposed_lock_key)
    );
  ELSE
    PERFORM pg_advisory_xact_lock(proposed_lock_key);
  END IF;

  -- A course with an existing parent or child cannot change college.
  -- An intra-college department move is allowed; a cross-college move is not.
  IF TG_OP = 'UPDATE'
     AND previous_college_id IS DISTINCT FROM proposed_college_id
     AND (NEW.parent_course_id IS NOT NULL
          OR EXISTS (
            SELECT 1 FROM courses child
             WHERE child.parent_course_id = NEW.id
          )) THEN
    RAISE EXCEPTION 'cannot move related course across colleges'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.parent_course_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.parent_course_id = NEW.id THEN
    RAISE EXCEPTION 'a course cannot be its own parent'
      USING ERRCODE = '23514';
  END IF;

  SELECT department.college_id
    INTO parent_college_id
    FROM courses parent
    INNER JOIN departments department
      ON department.id = parent.department_id
   WHERE parent.id = NEW.parent_course_id;

  IF parent_college_id IS NULL
     OR parent_college_id IS DISTINCT FROM proposed_college_id THEN
    RAISE EXCEPTION 'parent course belongs to another college'
      USING ERRCODE = '23514';
  END IF;

  WITH RECURSIVE ancestry (
    id, parent_course_id, college_id, visited, cycle
  ) AS (
    SELECT parent.id, parent.parent_course_id, department.college_id,
           ARRAY[parent.id]::uuid[], false
      FROM courses parent
      INNER JOIN departments department
        ON department.id = parent.department_id
     WHERE parent.id = NEW.parent_course_id
    UNION ALL
    SELECT ancestor.id, ancestor.parent_course_id, department.college_id,
           ancestry.visited || ancestor.id,
           ancestor.id = ANY(ancestry.visited)
      FROM ancestry
      INNER JOIN courses ancestor
        ON ancestor.id = ancestry.parent_course_id
      INNER JOIN departments department
        ON department.id = ancestor.department_id
     WHERE NOT ancestry.cycle
  )
  SELECT EXISTS (
    SELECT 1
      FROM ancestry
     WHERE id = NEW.id
        OR cycle
        OR college_id IS DISTINCT FROM proposed_college_id
  ) INTO invalid_ancestry;

  IF invalid_ancestry THEN
    RAISE EXCEPTION 'parent course ancestry is cyclic or cross-college'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$db05_course_parent$;

CREATE TRIGGER db05_course_parent_before_write
BEFORE INSERT OR UPDATE OF parent_course_id, department_id
ON courses
FOR EACH ROW EXECUTE FUNCTION db05_course_parent_guard();

-- A department college reassignment bypasses the courses trigger otherwise.
-- Lock the same old/new college keys before evaluating whether it has courses.
CREATE OR REPLACE FUNCTION db05_department_course_college_move_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $db05_department_move$
DECLARE
  old_lock_key bigint;
  new_lock_key bigint;
BEGIN
  IF NEW.college_id IS NOT DISTINCT FROM OLD.college_id THEN
    RETURN NEW;
  END IF;

  old_lock_key := hashtextextended(
    'db05_course_parent_college:' || OLD.college_id::text, 0
  );
  new_lock_key := hashtextextended(
    'db05_course_parent_college:' || NEW.college_id::text, 0
  );
  PERFORM pg_advisory_xact_lock(LEAST(old_lock_key, new_lock_key));
  PERFORM pg_advisory_xact_lock(GREATEST(old_lock_key, new_lock_key));

  IF EXISTS (
    SELECT 1 FROM courses WHERE department_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'cannot move department with existing courses to another college'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$db05_department_move$;

CREATE TRIGGER db05_department_course_college_before_move
BEFORE UPDATE OF college_id ON departments
FOR EACH ROW EXECUTE FUNCTION db05_department_course_college_move_guard();

COMMIT;

-- REQUIRED NEGATIVE/RACE ACCEPTANCE: NOT EXECUTED.
-- * parent A->A rejected; A->B->C->A rejected; existing loop rejected.
-- * parent in another college rejected; grandparent cross-college rejected.
-- * same-college parent accepted; no-parent and explicit clear accepted.
-- * two concurrent transactions setting A.parent=B / B.parent=A cannot both
--   commit; test READ COMMITTED, SERIALIZABLE, and retry/deadlock handling.
-- * moving a parent or child across colleges rejected; same-college
--   department change permitted. Moving department.college_id with courses
--   rejected. Race department move vs course insert/parent assignment tested.
-- * multirow UPDATE and parent reassignment against parallel archival tested.
-- * direct SQL cannot bypass college integrity, but API must still verify actor
--   permission and legacy null/zero clear semantics.
-- * clean PG migration replay, index/trigger collision, rollback and drift
--   tests must pass before Chat 1 may register this candidate.
