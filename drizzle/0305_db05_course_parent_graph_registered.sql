-- DB-008 registered, replayable PostgreSQL course-parent graph and department ownership guards.
-- Canonical DB05 source: db05-course-parent-graph-guard.draft.sql +
-- db05-department-college-move.draft.sql. No duplicate parent columns/FKs.
-- All writers share advisory transaction lock 605008001 under READ COMMITTED.
-- This is a partial DB-008 promotion; other DB05 content/history contracts remain open.
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
--> statement-breakpoint
CREATE TRIGGER db05_course_parent_graph_before_write
BEFORE INSERT OR UPDATE OF parent_course_id, department_id
ON courses
FOR EACH ROW EXECUTE FUNCTION db05_course_parent_graph_guard();
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TRIGGER db05_department_course_college_before_move
BEFORE UPDATE OF college_id ON departments
FOR EACH ROW EXECUTE FUNCTION db05_department_course_college_move_guard();
