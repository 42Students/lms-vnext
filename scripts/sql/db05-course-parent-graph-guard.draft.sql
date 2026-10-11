-- DB-008 / Chat 6. UNREGISTERED SOURCE-REVIEW COMPANION SQL.
-- DO NOT execute or register independently. Only Chat 1 owns migrations.
-- This accompanies scripts/sql/db05-course-parent-facets.draft.sql,
-- and is NOT an eighth independent DB05 migration. It owns no duplicate
-- columns/indexes/checks. PostgreSQL acceptance is NOT EXECUTED.
--
-- Source: legacy CourseDTO.parentCourseId, CourseServiceImpl.setCourseFields
-- BE oracle 21bad59d4dfaf2fa11fdeaf9353327ce105697d5.
-- Current vNext: courses.department_id -> departments.college_id,
-- course_offerings.academic_period_id -> academic_periods.college_id.
--
-- On the course row mutation, enforce:
-- 1. parent and child belong to the SAME college;
-- 2. parent graph cannot point back to the child, including indirect cycles;
-- 3. existing direct child courses cannot become cross-college when a
--    parent course's department_id changes;
-- 4. existing offerings' period college cannot conflict with a moved course.
--
-- A transaction-level advisory lock serializes these course parent mutations
-- (under READ COMMITTED). Its numeric key is intentionally constant and
-- MUST be used by *all* services/DDL that edit this graph. This DOES NOT
-- protect separate direct UPDATE departments SET college_id=..., or edits to
-- academic_periods.college_id, without additional upstream guards. A second
-- W01 migration cannot infer full safety from this companion alone.
--
-- STRICT PRECONDITIONS before integrating:
-- * The db05-course-parent-facets parent_course_id column already exists.
-- * Explicitly reject non-READ COMMITTED isolation until snapshot/race proof.
-- * Source-confirm whether parent relationships are allowed across colleges.
--   This proposal uses same-college conservative security invariant.
-- * Ensure legacy explicit "0 clears parent" maps to NULL in vNext service.
-- * Do not rewrite a course's created_by_organization_id from arbitrary
--   client-provided input; permission/tenant context is authoritative.
BEGIN;

CREATE OR REPLACE FUNCTION db05_course_parent_graph_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $db05_course_parent$
DECLARE
  child_college_id uuid;
  parent_college_id uuid;
  invalid_ancestry boolean;
  invalid_child boolean;
  invalid_offering boolean;
BEGIN
  IF current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION 'course parent write requires read committed isolation pending concurrency proof'
      USING ERRCODE = '25001';
  END IF;

  PERFORM pg_advisory_xact_lock(605008001::bigint);

  SELECT department.college_id INTO child_college_id
  FROM departments department
  WHERE department.id = NEW.department_id;

  IF child_college_id IS NULL THEN
    RAISE EXCEPTION 'course department must resolve to a college'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.parent_course_id IS NOT NULL THEN
    IF NEW.parent_course_id = NEW.id THEN
      RAISE EXCEPTION 'course cannot parent itself'
        USING ERRCODE = '23514';
    END IF;

    SELECT department.college_id INTO parent_college_id
    FROM courses parent_course
    JOIN departments department ON department.id = parent_course.department_id
    WHERE parent_course.id = NEW.parent_course_id;

    IF parent_college_id IS NULL
       OR parent_college_id IS DISTINCT FROM child_college_id THEN
      RAISE EXCEPTION 'parent course must belong to the same college'
        USING ERRCODE = '23514';
    END IF;

    -- Walk ALL ancestors. Track visited IDs so already-corrupt historical
    -- loops terminate rather than consume unbounded recursive memory.
    WITH RECURSIVE ancestors(id, parent_course_id, visited, cycle) AS (
      SELECT candidate.id, candidate.parent_course_id,
             ARRAY[candidate.id], false
      FROM courses candidate
      WHERE candidate.id = NEW.parent_course_id
      UNION ALL
      SELECT candidate.id, candidate.parent_course_id,
             ancestors.visited || candidate.id,
             candidate.id = ANY(ancestors.visited)
      FROM ancestors
      JOIN courses candidate ON candidate.id = ancestors.parent_course_id
      WHERE NOT ancestors.cycle
    )
    SELECT EXISTS(
      SELECT 1 FROM ancestors
      WHERE id = NEW.id OR cycle
    ) INTO invalid_ancestry;

    IF invalid_ancestry THEN
      RAISE EXCEPTION 'parent course ancestry contains a cycle'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  -- Updating the parent row's own department can break existing child links
  -- even when parent_course_id itself does not change.
  SELECT EXISTS(
    SELECT 1
    FROM courses existing_child
    JOIN departments child_department
      ON child_department.id = existing_child.department_id
    WHERE existing_child.parent_course_id = NEW.id
      AND child_department.college_id IS DISTINCT FROM child_college_id
  ) INTO invalid_child;

  IF invalid_child THEN
    RAISE EXCEPTION 'department move would strand child course in another college'
      USING ERRCODE = '23514';
  END IF;

  -- An existing course offering may reference a period in the old college.
  SELECT EXISTS(
    SELECT 1
    FROM course_offerings offering
    JOIN academic_periods period ON period.id = offering.academic_period_id
    WHERE offering.course_id = NEW.id
      AND period.college_id IS DISTINCT FROM child_college_id
  ) INTO invalid_offering;

  IF invalid_offering THEN
    RAISE EXCEPTION 'course department move conflicts with offering academic period'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$db05_course_parent$;

CREATE TRIGGER db05_course_parent_graph_before_write
BEFORE INSERT OR UPDATE OF parent_course_id, department_id
ON courses
FOR EACH ROW EXECUTE FUNCTION db05_course_parent_graph_guard();

COMMIT;

-- UNEXECUTED POSTGRESQL NEGATIVE GATES:
-- A. Same-college chain A <- B <- C allowed.
-- B. A parent=A rejected, A parent=C (3-node cycle) rejected SQLSTATE 23514.
-- C. A and B in different colleges: A parent=B rejected 23514.
-- D. Parent course moves to another college while old-college children exist:
--    rejected 23514 even if parent_course_id did not change.
-- E. Course with an offering/period from college A moves department to B:
--    rejected 23514.
-- F. Two concurrent reciprocal parent changes under READ COMMITTED:
--    one succeeds or waits, the second rejects cycle; never both succeed.
-- G. Non-READ-COMMITTED writes explicitly fail 25001 until tested.
-- H. Existing attached sections, deliveries, progress and discussions remain
--    consistently scoped after *upstream* department/academic-period moves.
-- I. Root course, no parent and no offering succeeds; clearing parent works.
-- J. Clean replay after parent columns, no duplicate triggers on W01 journal.
