-- DB-005 registered DB02 academic parent, curriculum, cohort progression,
-- teaching rooms and timetable integrity. Canonical source was previously
-- verified on disposable PG17 via db02-staged-acceptance.
-- Greenfield: NO legacy production data import. Safe failure on an existing
-- vNext offering without a specifically approved term mapping.
-- Postgres types/functions/guards were code-reviewed in the canonical
-- scripts/sql/db02-academic-progression-and-rooms-staging.sql;
-- the generated Drizzle statement breakpoints are parsed at top-level only.
-- ---------------------------------------------------------------------------
-- 1) Program-scoped term identity + ordered curriculum
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS program_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES programs(id) ON DELETE RESTRICT,
  term_number integer NOT NULL,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  total_credits integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT program_terms_term_number_ck CHECK (term_number >= 1),
  CONSTRAINT program_terms_name_ck CHECK (btrim(name) <> ''),
  CONSTRAINT program_terms_total_credits_ck CHECK (total_credits IS NULL OR total_credits >= 0),
  CONSTRAINT program_terms_program_number_uq UNIQUE (program_id, term_number)
);
--> statement-breakpoint


CREATE INDEX IF NOT EXISTS program_terms_program_active_idx
  ON program_terms(program_id, is_active, term_number);
--> statement-breakpoint


CREATE OR REPLACE FUNCTION db02_guard_program_term_bounds()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  max_terms integer;
BEGIN
  SELECT duration_terms INTO max_terms FROM programs WHERE id=NEW.program_id FOR SHARE;
  IF max_terms IS NULL THEN
    RAISE EXCEPTION 'Unknown program' USING ERRCODE='23503';
  END IF;
  IF NEW.term_number > max_terms THEN
    RAISE EXCEPTION 'Program term exceeds configured program duration'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint


DROP TRIGGER IF EXISTS db02_program_term_bounds_guard ON program_terms;
--> statement-breakpoint

CREATE OR REPLACE TRIGGER db02_program_term_bounds_guard
BEFORE INSERT OR UPDATE OF program_id, term_number ON program_terms
FOR EACH ROW EXECUTE FUNCTION db02_guard_program_term_bounds();
--> statement-breakpoint


-- Already registered as migration 0050; refresh function/trigger on the
-- disposable DB02 overlay so the canonical trigger manifest stays exact.
CREATE OR REPLACE FUNCTION db02_guard_program_duration_term_floor()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.duration_terms < OLD.duration_terms AND EXISTS
  (SELECT 1 FROM program_terms WHERE program_id=OLD.id AND term_number>NEW.duration_terms) THEN
  RAISE EXCEPTION 'Cannot shorten program below existing term number' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END;
$$;
--> statement-breakpoint

DROP TRIGGER IF EXISTS db02_program_duration_term_floor ON programs;
--> statement-breakpoint

CREATE OR REPLACE TRIGGER db02_program_duration_term_floor BEFORE UPDATE OF duration_terms ON programs
 FOR EACH ROW EXECUTE FUNCTION db02_guard_program_duration_term_floor();
--> statement-breakpoint


CREATE TABLE IF NOT EXISTS program_term_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_term_id uuid NOT NULL REFERENCES program_terms(id) ON DELETE RESTRICT,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  type course_offering_type NOT NULL DEFAULT 'CORE',
  credits integer,
  display_order integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT program_term_courses_credits_ck CHECK (credits IS NULL OR credits BETWEEN 0 AND 30),
  CONSTRAINT program_term_courses_display_order_ck CHECK (display_order >= 1),
  CONSTRAINT program_term_courses_term_course_uq UNIQUE (program_term_id, course_id)
);
--> statement-breakpoint


CREATE INDEX IF NOT EXISTS program_term_courses_course_idx
  ON program_term_courses(course_id, program_term_id);
--> statement-breakpoint


-- Keep curriculum links within one college. A course from another department/college
-- must never be attached to a program term by direct SQL.
CREATE OR REPLACE FUNCTION db02_guard_program_term_course_tenant()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  program_college uuid;
  course_college uuid;
BEGIN
  SELECT d.college_id INTO program_college
    FROM program_terms pt
    JOIN programs p ON p.id = pt.program_id
    JOIN departments d ON d.id = p.department_id
   WHERE pt.id = NEW.program_term_id FOR SHARE OF pt,p,d;

  SELECT d.college_id INTO course_college
    FROM courses c
    JOIN departments d ON d.id = c.department_id
   WHERE c.id = NEW.course_id FOR SHARE OF c,d;

  IF program_college IS NULL OR course_college IS NULL THEN
    RAISE EXCEPTION 'Unknown program term or course' USING ERRCODE='23503';
  END IF;
  IF program_college <> course_college THEN
    RAISE EXCEPTION 'Program term and course must belong to the same college'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint


DROP TRIGGER IF EXISTS db02_program_term_course_tenant ON program_term_courses;
--> statement-breakpoint

CREATE OR REPLACE TRIGGER db02_program_term_course_tenant
BEFORE INSERT OR UPDATE OF program_term_id, course_id ON program_term_courses
FOR EACH ROW EXECUTE FUNCTION db02_guard_program_term_course_tenant();
--> statement-breakpoint


-- Semester-course parent identity is immutable in the active legacy service: only
-- mandatory/type, credits and display order are editable. Keep the normalized pair stable.
CREATE OR REPLACE FUNCTION db02_guard_program_term_course_identity()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.program_term_id IS DISTINCT FROM OLD.program_term_id
     OR NEW.course_id IS DISTINCT FROM OLD.course_id THEN
    RAISE EXCEPTION 'Program-term course identity is immutable'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint


DROP TRIGGER IF EXISTS db02_program_term_course_identity_guard ON program_term_courses;
--> statement-breakpoint

CREATE OR REPLACE TRIGGER db02_program_term_course_identity_guard
BEFORE UPDATE OF program_term_id, course_id ON program_term_courses
FOR EACH ROW EXECUTE FUNCTION db02_guard_program_term_course_identity();
--> statement-breakpoint


-- A curriculum row may be removed while unused, matching legacy semester-course removal.
-- Once any offering materializes the term/course pair, deletion would rewrite historical
-- curriculum identity and is therefore rejected.
CREATE OR REPLACE FUNCTION db02_guard_program_term_course_delete()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM course_offerings co
     WHERE co.program_term_id = OLD.program_term_id
       AND co.course_id = OLD.course_id
  ) THEN
    RAISE EXCEPTION 'Program-term course cannot be removed after an offering exists'
      USING ERRCODE = '23514';
  END IF;
  RETURN OLD;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_program_term_course_delete_guard
BEFORE DELETE ON program_term_courses
FOR EACH ROW EXECUTE FUNCTION db02_guard_program_term_course_delete();
--> statement-breakpoint


-- Keep a materialized CORE curriculum row historically CORE.
CREATE OR REPLACE FUNCTION db02_guard_program_term_course_type_history()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.type IS DISTINCT FROM OLD.type
     AND EXISTS (
       SELECT 1
         FROM course_offerings co
        WHERE co.program_term_course_id = OLD.id
          AND co.type = 'CORE'
     ) THEN
    RAISE EXCEPTION 'Mapped curriculum cannot change type after CORE offering materialization'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint

CREATE OR REPLACE TRIGGER db02_program_term_course_type_history_guard
BEFORE UPDATE OF type ON program_term_courses
FOR EACH ROW EXECUTE FUNCTION db02_guard_program_term_course_type_history();
--> statement-breakpoint



-- Legacy semester-course credits are valid from 0..30. A zero-credit curriculum row
-- must remain materializable as a cohort offering instead of failing a stricter vNext check.
ALTER TABLE course_offerings
  DROP CONSTRAINT IF EXISTS course_offerings_credits_ck;
--> statement-breakpoint


DO $db02_constraint$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'course_offerings'::regclass AND conname = 'db02_course_offerings_credits_ck'
  ) THEN
    ALTER TABLE course_offerings
      ADD CONSTRAINT db02_course_offerings_credits_ck CHECK (credits IS NULL OR credits BETWEEN 0 AND 30);
  END IF;
END
$db02_constraint$;
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- 1a) Stable tenant ownership + academic-period scope
-- ---------------------------------------------------------------------------
-- Department ownership is immutable in product APIs. Programs may move departments only
-- within one college; courses do not expose department reassignment. Protect those facts
-- at the DB boundary because every downstream academic tenant scope derives through them.
CREATE OR REPLACE FUNCTION db02_guard_department_college_immutability()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.college_id <> OLD.college_id THEN
    RAISE EXCEPTION 'Department cannot move to another college'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint


DROP TRIGGER IF EXISTS db02_department_college_immutable ON departments;
--> statement-breakpoint

CREATE OR REPLACE TRIGGER db02_department_college_immutable
BEFORE UPDATE OF college_id ON departments
FOR EACH ROW EXECUTE FUNCTION db02_guard_department_college_immutability();
--> statement-breakpoint


CREATE OR REPLACE FUNCTION db02_guard_program_department_move()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  old_college uuid;
  new_college uuid;
BEGIN
  IF NEW.department_id = OLD.department_id THEN
    RETURN NEW;
  END IF;

  SELECT college_id INTO old_college FROM departments WHERE id = OLD.department_id FOR SHARE;
  SELECT college_id INTO new_college FROM departments WHERE id = NEW.department_id FOR SHARE;

  IF old_college IS NULL OR new_college IS NULL THEN
    RAISE EXCEPTION 'Unknown program department'
      USING ERRCODE = '23503';
  END IF;

  IF old_college <> new_college THEN
    RAISE EXCEPTION 'Program department move must stay within one college'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint


DROP TRIGGER IF EXISTS db02_program_department_move_guard ON programs;
--> statement-breakpoint

CREATE OR REPLACE TRIGGER db02_program_department_move_guard
BEFORE UPDATE OF department_id ON programs
FOR EACH ROW EXECUTE FUNCTION db02_guard_program_department_move();
--> statement-breakpoint


CREATE OR REPLACE FUNCTION db02_guard_course_department_move()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  old_college uuid;
  new_college uuid;
BEGIN
  IF NEW.department_id = OLD.department_id THEN
    RETURN NEW;
  END IF;

  SELECT college_id INTO old_college FROM departments WHERE id = OLD.department_id FOR SHARE;
  SELECT college_id INTO new_college FROM departments WHERE id = NEW.department_id FOR SHARE;

  IF old_college IS NULL OR new_college IS NULL THEN
    RAISE EXCEPTION 'Unknown course department'
      USING ERRCODE = '23503';
  END IF;

  IF old_college <> new_college THEN
    RAISE EXCEPTION 'Course department move must stay within one college'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint


DROP TRIGGER IF EXISTS db02_course_department_move_guard ON courses;
--> statement-breakpoint

CREATE OR REPLACE TRIGGER db02_course_department_move_guard
BEFORE UPDATE OF department_id ON courses
FOR EACH ROW EXECUTE FUNCTION db02_guard_course_department_move();
--> statement-breakpoint


DROP TRIGGER IF EXISTS db02_cohort_period_scope_guard ON cohorts;
--> statement-breakpoint

DROP FUNCTION IF EXISTS db02_guard_cohort_period_scope();
--> statement-breakpoint

CREATE OR REPLACE FUNCTION db02_guard_cohort_period_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  program_college uuid;
  start_college uuid;
  end_college uuid;
  start_day date;
  expected_end_day date;
  start_status academic_period_status;
BEGIN
  SELECT d.college_id
    INTO program_college
    FROM programs p
    JOIN departments d ON d.id = p.department_id
   WHERE p.id = NEW.program_id
   FOR SHARE OF p;

  SELECT ap.college_id, ap.start_date, ap.status
    INTO start_college, start_day, start_status
    FROM academic_periods ap
   WHERE ap.id = NEW.start_period_id
   FOR SHARE OF ap;

  IF program_college IS NULL OR start_college IS NULL THEN
    RAISE EXCEPTION 'Unknown cohort program or start period'
      USING ERRCODE = '23503';
  END IF;

  IF program_college <> start_college THEN
    RAISE EXCEPTION 'Cohort program and start period must belong to one college'
      USING ERRCODE = '23514';
  END IF;

  IF start_status = 'CLOSED' THEN
    RAISE EXCEPTION 'Cohort cannot start in a closed academic period'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.expected_end_period_id IS NOT NULL THEN
    SELECT ap.college_id, ap.end_date
      INTO end_college, expected_end_day
      FROM academic_periods ap
     WHERE ap.id = NEW.expected_end_period_id
     FOR SHARE OF ap;

    IF end_college IS NULL THEN
      RAISE EXCEPTION 'Unknown cohort expected end period'
        USING ERRCODE = '23503';
    END IF;

    IF end_college <> program_college THEN
      RAISE EXCEPTION 'Cohort expected end period must belong to the program college'
        USING ERRCODE = '23514';
    END IF;

    IF expected_end_day < start_day THEN
      RAISE EXCEPTION 'Cohort expected end period cannot end before cohort start'
        USING ERRCODE = '23514';
    END IF;

    -- A PLANNED cohort may change its expected end through the API, but the parent window
    -- cannot be shrunk underneath already-materialized section/offering/progression state.
    IF TG_OP = 'UPDATE'
       AND NEW.expected_end_period_id IS DISTINCT FROM OLD.expected_end_period_id
       AND (
         EXISTS (
           SELECT 1
             FROM sections s
             JOIN academic_periods ap ON ap.id = s.academic_period_id
            WHERE s.cohort_id = OLD.id
              AND ap.end_date > expected_end_day
         )
         OR EXISTS (
           SELECT 1
             FROM course_offerings co
             JOIN academic_periods ap ON ap.id = co.academic_period_id
            WHERE co.cohort_id = OLD.id
              AND ap.end_date > expected_end_day
         )
         OR EXISTS (
           SELECT 1
             FROM cohort_progression_state cps
             JOIN academic_periods ap ON ap.id = cps.current_period_id
            WHERE cps.cohort_id = OLD.id
              AND ap.end_date > expected_end_day
         )
       ) THEN
      RAISE EXCEPTION 'Cohort expected end cannot exclude existing academic state'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_cohort_period_scope_guard
BEFORE INSERT OR UPDATE OF program_id, start_period_id, expected_end_period_id
ON cohorts
FOR EACH ROW EXECUTE FUNCTION db02_guard_cohort_period_scope();
--> statement-breakpoint


DROP TRIGGER IF EXISTS db02_section_period_scope_guard ON sections;
--> statement-breakpoint

DROP FUNCTION IF EXISTS db02_guard_section_period_scope();
--> statement-breakpoint

CREATE OR REPLACE FUNCTION db02_guard_section_period_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  cohort_college uuid;
  period_college uuid;
  cohort_start_day date;
  cohort_end_day date;
  period_start_day date;
  period_end_day date;
  period_status academic_period_status;
BEGIN
  SELECT d.college_id, start_ap.start_date, end_ap.end_date
    INTO cohort_college, cohort_start_day, cohort_end_day
    FROM cohorts c
    JOIN programs p ON p.id = c.program_id
    JOIN departments d ON d.id = p.department_id
    JOIN academic_periods start_ap ON start_ap.id = c.start_period_id
    LEFT JOIN academic_periods end_ap ON end_ap.id = c.expected_end_period_id
   WHERE c.id = NEW.cohort_id
   FOR SHARE OF c;

  SELECT ap.college_id, ap.start_date, ap.end_date, ap.status
    INTO period_college, period_start_day, period_end_day, period_status
    FROM academic_periods ap
   WHERE ap.id = NEW.academic_period_id
   FOR SHARE OF ap;

  IF cohort_college IS NULL OR period_college IS NULL THEN
    RAISE EXCEPTION 'Unknown section cohort or academic period'
      USING ERRCODE = '23503';
  END IF;

  IF cohort_college <> period_college THEN
    RAISE EXCEPTION 'Section cohort and academic period must belong to one college'
      USING ERRCODE = '23514';
  END IF;

  IF period_status = 'CLOSED' THEN
    RAISE EXCEPTION 'Section cannot be created or moved into a closed academic period'
      USING ERRCODE = '23514';
  END IF;

  IF period_start_day < cohort_start_day
     OR (cohort_end_day IS NOT NULL AND period_end_day > cohort_end_day) THEN
    RAISE EXCEPTION 'Section academic period must stay inside the cohort period window'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_section_period_scope_guard
BEFORE INSERT OR UPDATE OF cohort_id, academic_period_id
ON sections
FOR EACH ROW EXECUTE FUNCTION db02_guard_section_period_scope();
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- 1b) Stable program-term identity on course offerings
-- ---------------------------------------------------------------------------
-- academic_period_id is calendar identity. program_term_id is the stable program-specific
-- curriculum term identity required by promotion, teaching history and elective eligibility.
ALTER TABLE course_offerings
  ADD COLUMN IF NOT EXISTS program_term_id uuid
    REFERENCES program_terms(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS program_term_course_id uuid
    REFERENCES program_term_courses(id) ON DELETE RESTRICT;
--> statement-breakpoint


-- Existing vNext (not legacy production) offerings must have an explicitly
-- approved curriculum term. Never guess or fabricate a mapping. On fresh
-- greenfield DB there are zero offerings and the constraint is safe.
DO $db02_registered_migrate$
BEGIN
 IF EXISTS (SELECT 1 FROM course_offerings WHERE program_term_id IS NULL) THEN
   RAISE EXCEPTION 'DB02 registration blocked: existing vNext offerings need explicit program-term mapping before migration'
     USING ERRCODE='23514';
 END IF;
END;
$db02_registered_migrate$;
--> statement-breakpoint

ALTER TABLE course_offerings ALTER COLUMN program_term_id SET NOT NULL;
--> statement-breakpoint


DO $db02_constraint$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'course_offerings'::regclass AND conname = 'course_offerings_curriculum_ref_ck'
  ) THEN
    ALTER TABLE course_offerings
      ADD CONSTRAINT course_offerings_curriculum_ref_ck CHECK (
    (type = 'CORE' AND program_term_course_id IS NOT NULL)
    OR (type = 'ELECTIVE' AND program_term_course_id IS NULL)
  );
  END IF;
END
$db02_constraint$;
--> statement-breakpoint


CREATE INDEX IF NOT EXISTS course_offerings_program_term_idx
  ON course_offerings(program_term_id, status);
--> statement-breakpoint


CREATE OR REPLACE FUNCTION db02_guard_course_offering_program_term_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  term_program uuid;
  cohort_program uuid;
  cohort_college uuid;
  course_college uuid;
  period_college uuid;
BEGIN
  SELECT pt.program_id
    INTO term_program
    FROM program_terms pt
   WHERE pt.id = NEW.program_term_id;

  SELECT c.program_id, d.college_id
    INTO cohort_program, cohort_college
    FROM cohorts c
    JOIN programs p ON p.id = c.program_id
    JOIN departments d ON d.id = p.department_id
   WHERE c.id = NEW.cohort_id;

  SELECT d.college_id
    INTO course_college
    FROM courses crs
    JOIN departments d ON d.id = crs.department_id
   WHERE crs.id = NEW.course_id;

  SELECT ap.college_id
    INTO period_college
    FROM academic_periods ap
   WHERE ap.id = NEW.academic_period_id;

  IF term_program IS NULL OR cohort_program IS NULL OR cohort_college IS NULL
     OR course_college IS NULL OR period_college IS NULL THEN
    RAISE EXCEPTION 'Unknown course offering academic scope'
      USING ERRCODE = '23503';
  END IF;

  IF term_program <> cohort_program THEN
    RAISE EXCEPTION 'Course offering term must belong to the cohort program'
      USING ERRCODE = '23514';
  END IF;

  IF course_college <> cohort_college OR period_college <> cohort_college THEN
    RAISE EXCEPTION 'Course offering course, cohort and period must belong to one college'
      USING ERRCODE = '23514';
  END IF;

  -- CORE delivery carries a concrete curriculum-row FK. This gives native PostgreSQL
  -- delete concurrency protection in addition to this semantic term/course validation.
  -- ELECTIVE delivery is term-bound but deliberately has no fixed curriculum-row FK.
  IF NEW.type = 'CORE' THEN
    IF NEW.program_term_course_id IS NULL THEN
      RAISE EXCEPTION 'Core course offering requires a program-term curriculum row'
        USING ERRCODE = '23514';
    END IF;

    PERFORM 1
      FROM program_term_courses ptc
     WHERE ptc.id = NEW.program_term_course_id
       AND ptc.program_term_id = NEW.program_term_id
       AND ptc.course_id = NEW.course_id
       AND ptc.type = 'CORE'
     FOR SHARE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Core course offering curriculum row must match selected term and course'
        USING ERRCODE = '23514';
    END IF;
  ELSIF NEW.program_term_course_id IS NOT NULL THEN
    RAISE EXCEPTION 'Elective course offering must not claim a fixed curriculum row'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_course_offering_program_term_guard
BEFORE INSERT OR UPDATE OF course_id, cohort_id, academic_period_id, type, program_term_id, program_term_course_id
ON course_offerings
FOR EACH ROW EXECUTE FUNCTION db02_guard_course_offering_program_term_scope();
--> statement-breakpoint


DROP TRIGGER IF EXISTS db02_course_offering_period_window_guard ON course_offerings;
--> statement-breakpoint

DROP FUNCTION IF EXISTS db02_guard_course_offering_period_window();
--> statement-breakpoint

CREATE OR REPLACE FUNCTION db02_guard_course_offering_period_window()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  cohort_start_day date;
  cohort_end_day date;
  period_start_day date;
  period_end_day date;
  period_status academic_period_status;
BEGIN
  SELECT start_ap.start_date, end_ap.end_date
    INTO cohort_start_day, cohort_end_day
    FROM cohorts c
    JOIN academic_periods start_ap ON start_ap.id = c.start_period_id
    LEFT JOIN academic_periods end_ap ON end_ap.id = c.expected_end_period_id
   WHERE c.id = NEW.cohort_id
   FOR SHARE OF c;

  SELECT ap.start_date, ap.end_date, ap.status
    INTO period_start_day, period_end_day, period_status
    FROM academic_periods ap
   WHERE ap.id = NEW.academic_period_id
   FOR SHARE OF ap;

  IF cohort_start_day IS NULL OR period_start_day IS NULL THEN
    RAISE EXCEPTION 'Unknown course offering cohort or academic period'
      USING ERRCODE = '23503';
  END IF;

  IF period_status = 'CLOSED' THEN
    RAISE EXCEPTION 'Course offering cannot use a closed academic period'
      USING ERRCODE = '23514';
  END IF;

  IF period_start_day < cohort_start_day
     OR (cohort_end_day IS NOT NULL AND period_end_day > cohort_end_day) THEN
    RAISE EXCEPTION 'Course offering academic period must stay inside cohort window'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_course_offering_period_window_guard
BEFORE INSERT OR UPDATE OF cohort_id, academic_period_id
ON course_offerings
FOR EACH ROW EXECUTE FUNCTION db02_guard_course_offering_period_window();
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- 1c) Cohort/class CRUD state that is not equivalent to college-wide periods
-- ---------------------------------------------------------------------------
-- Legacy batch status is ACTIVE | INACTIVE | COMPLETED and INACTIVE is editable/reversible.
-- ARCHIVED is a separate vNext terminal/storage concern and cannot substitute for INACTIVE.
--
-- PostgreSQL cannot use an enum value introduced in the same transaction.
-- The registered migration already promotes INACTIVE; this psql-only replay
-- runs with statement autocommit and keeps the existing enum OID intact.
-- Never rename the live enum and invalidate dependent constraints/functions.
-- The disposable runner verifies INACTIVE is registered before replay.
ALTER TYPE cohort_status ADD VALUE IF NOT EXISTS 'INACTIVE' BEFORE 'COMPLETED';
--> statement-breakpoint


-- Preserve the editable legacy ACTIVE/INACTIVE/COMPLETED states while protecting vNext's
-- separate ARCHIVED lifecycle. Direct SQL must not create an already-archived cohort, archive
-- ACTIVE/INACTIVE cohorts behind the service state machine, or resurrect an archived cohort.
CREATE OR REPLACE FUNCTION db02_guard_cohort_status_lifecycle()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_program_status program_status;
BEGIN
  -- A cohort is a live child of its academic program. Lock the program row
  -- against concurrent ARCHIVE before allowing creation/reactivation.
  SELECT status INTO v_program_status FROM programs
   WHERE id = NEW.program_id FOR SHARE;
  IF v_program_status IS DISTINCT FROM 'ACTIVE'
     AND (TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM 'ARCHIVED') THEN
    RAISE EXCEPTION 'Cannot activate or create a cohort under archived program'
      USING ERRCODE='23514';
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'ARCHIVED' THEN
      RAISE EXCEPTION 'Cohort cannot be created already archived'
        USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.status = 'ARCHIVED' AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Archived cohort status is terminal'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.status = 'ARCHIVED'
     AND OLD.status NOT IN ('PLANNED', 'COMPLETED') THEN
    RAISE EXCEPTION 'Cohort may archive only from PLANNED or COMPLETED'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint


DROP TRIGGER IF EXISTS db02_cohort_status_lifecycle_guard ON cohorts;
--> statement-breakpoint

CREATE OR REPLACE TRIGGER db02_cohort_status_lifecycle_guard
BEFORE INSERT OR UPDATE OF status ON cohorts
FOR EACH ROW EXECUTE FUNCTION db02_guard_cohort_status_lifecycle();
--> statement-breakpoint


-- An ARCHIVED program is not a live parent. Without this reverse guard,
-- a college could archive the program while a PLANNED/ACTIVE/COMPLETED
-- cohort still depends on it. The cohort insert/status guards acquire a
-- SHARE lock on this same program row to serialize both commit orders.
CREATE OR REPLACE FUNCTION db02_guard_program_archive_with_live_cohorts()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'ACTIVE' AND NEW.status = 'ARCHIVED'
     AND EXISTS (
       SELECT 1 FROM cohorts c
        WHERE c.program_id = OLD.id
          AND c.status <> 'ARCHIVED'
     ) THEN
    RAISE EXCEPTION 'Cannot archive program with nonarchived cohorts'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint


DROP TRIGGER IF EXISTS db02_program_archive_cohort_dependency_guard ON programs;
--> statement-breakpoint

CREATE OR REPLACE TRIGGER db02_program_archive_cohort_dependency_guard
BEFORE UPDATE OF status ON programs
FOR EACH ROW EXECUTE FUNCTION db02_guard_program_archive_with_live_cohorts();
--> statement-breakpoint





-- Legacy batch dates are optional, independently editable lifecycle metadata. Period FKs
-- remain the scheduling/calendar anchors, but cannot reproduce arbitrary batch-specific dates.
ALTER TABLE cohorts
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date;
--> statement-breakpoint


DO $db02_constraint$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'cohorts'::regclass AND conname = 'cohorts_lifecycle_date_order_ck'
  ) THEN
    ALTER TABLE cohorts
      ADD CONSTRAINT cohorts_lifecycle_date_order_ck CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date);
  END IF;
END
$db02_constraint$;
--> statement-breakpoint


-- Legacy class description and lower_limit are live admin CRUD fields. sections.capacity is the
-- upper limit. Keep vNext capacity nullable for non-legacy creation flows, while compatibility
-- producers must provide it and obey the legacy 1..500 bound.
ALTER TABLE sections
  ADD COLUMN IF NOT EXISTS description text, -- registered by migration 0098
  ADD COLUMN IF NOT EXISTS minimum_capacity integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date;
--> statement-breakpoint


-- The migration already installs the lifecycle columns and some constraints.
-- Keep every check on first application, but never attempt duplicate names.
DO $db02_constraint$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'sections'::regclass AND conname = 'sections_capacity_ck'
  ) THEN
    ALTER TABLE sections
      ADD CONSTRAINT sections_capacity_ck CHECK (capacity IS NULL OR capacity BETWEEN 1 AND 500);
  END IF;
END
$db02_constraint$;
--> statement-breakpoint

DO $db02_constraint$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'sections'::regclass AND conname = 'sections_minimum_capacity_ck'
  ) THEN
    ALTER TABLE sections
      ADD CONSTRAINT sections_minimum_capacity_ck CHECK (minimum_capacity >= 0);
  END IF;
END
$db02_constraint$;
--> statement-breakpoint

DO $db02_constraint$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'sections'::regclass AND conname = 'sections_capacity_range_ck'
  ) THEN
    ALTER TABLE sections
      ADD CONSTRAINT sections_capacity_range_ck CHECK (capacity IS NULL OR minimum_capacity <= capacity);
  END IF;
END
$db02_constraint$;
--> statement-breakpoint

DO $db02_constraint$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'sections'::regclass AND conname = 'sections_lifecycle_date_order_ck'
  ) THEN
    ALTER TABLE sections
      ADD CONSTRAINT sections_lifecycle_date_order_ck CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date);
  END IF;
END
$db02_constraint$;
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- 1d) Delivery/event chain scope integrity
-- ---------------------------------------------------------------------------
-- Teaching assignments and schedules inherit cohort/period/term identity through delivery.
-- Protect that chain at the database boundary instead of relying only on service validation.
CREATE OR REPLACE FUNCTION db02_guard_course_section_delivery_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  offering_cohort uuid;
  offering_period uuid;
  offering_status course_offering_status;
  course_status_value course_status;
  section_cohort uuid;
  section_period uuid;
  section_status_value section_status;
BEGIN
  SELECT co.cohort_id, co.academic_period_id, co.status, crs.status
    INTO offering_cohort, offering_period, offering_status, course_status_value
    FROM course_offerings co
    JOIN courses crs ON crs.id = co.course_id
   WHERE co.id = NEW.offering_id
   FOR SHARE OF co, crs;

  SELECT s.cohort_id, s.academic_period_id, s.status
    INTO section_cohort, section_period, section_status_value
    FROM sections s
   WHERE s.id = NEW.section_id
   FOR SHARE OF s;

  IF offering_cohort IS NULL OR section_cohort IS NULL THEN
    RAISE EXCEPTION 'Unknown offering or section'
      USING ERRCODE = '23503';
  END IF;

  IF offering_cohort <> section_cohort OR offering_period <> section_period THEN
    RAISE EXCEPTION 'Course delivery offering and section must share cohort and academic period'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.ended_at IS NULL
     AND (
       offering_status IS DISTINCT FROM 'ACTIVE'
       OR course_status_value IS DISTINCT FROM 'ACTIVE'
       OR section_status_value IS DISTINCT FROM 'ACTIVE'
     ) THEN
    RAISE EXCEPTION 'Active course delivery requires ACTIVE offering, course and section'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_course_section_delivery_scope_guard
BEFORE INSERT OR UPDATE OF offering_id, section_id, ended_at
ON course_section_deliveries
FOR EACH ROW EXECUTE FUNCTION db02_guard_course_section_delivery_scope();
--> statement-breakpoint


CREATE OR REPLACE FUNCTION db02_guard_schedule_event_delivery_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  event_section uuid;
  delivery_section uuid;
BEGIN
  SELECT d.section_id
    INTO delivery_section
    FROM course_section_deliveries d
   WHERE d.id = NEW.delivery_id
   FOR SHARE OF d;

  SELECT e.section_id
    INTO event_section
    FROM section_schedule_events e
   WHERE e.id = NEW.schedule_event_id
   FOR SHARE OF e;

  IF event_section IS NULL OR delivery_section IS NULL THEN
    RAISE EXCEPTION 'Unknown schedule event or course delivery'
      USING ERRCODE = '23503';
  END IF;

  IF event_section <> delivery_section THEN
    RAISE EXCEPTION 'Schedule event course delivery must belong to the same section'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_schedule_event_delivery_scope_guard
BEFORE INSERT OR UPDATE OF schedule_event_id, delivery_id
ON section_schedule_event_courses
FOR EACH ROW EXECUTE FUNCTION db02_guard_schedule_event_delivery_scope();
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- 2) Canonical cohort progression state + immutable history
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cohort_progression_state (
  -- Initializer state is lifecycle-owned by the cohort. A history-free/child-free cohort may
  -- be hard-deleted for legacy batch-delete compatibility; progression EVENTS remain RESTRICT
  -- and therefore preserve any cohort that has actual academic history.
  cohort_id uuid PRIMARY KEY REFERENCES cohorts(id) ON DELETE CASCADE,
  current_term_number integer NOT NULL DEFAULT 1,
  current_academic_year_start integer,
  current_period_id uuid REFERENCES academic_periods(id) ON DELETE RESTRICT,
  version bigint NOT NULL DEFAULT 0,
  updated_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cohort_progression_term_ck CHECK (current_term_number >= 1),
  CONSTRAINT cohort_progression_year_ck CHECK (
    current_academic_year_start IS NULL OR current_academic_year_start BETWEEN 1900 AND 9998
  ),
  CONSTRAINT cohort_progression_version_ck CHECK (version >= 0)
);
--> statement-breakpoint


CREATE TABLE IF NOT EXISTS cohort_progression_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL REFERENCES cohorts(id) ON DELETE RESTRICT,
  from_term_number integer NOT NULL,
  to_term_number integer NOT NULL,
  from_academic_year_start integer,
  to_academic_year_start integer,
  from_period_id uuid REFERENCES academic_periods(id) ON DELETE RESTRICT,
  to_period_id uuid REFERENCES academic_periods(id) ON DELETE RESTRICT,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  event_kind varchar(16) NOT NULL,
  reason text,
  state_version bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cohort_progression_events_kind_ck
    CHECK (event_kind IN ('PROMOTION','CORRECTION')),
  CONSTRAINT cohort_progression_events_transition_ck CHECK (
    (event_kind = 'PROMOTION' AND to_term_number = from_term_number + 1)
    OR (event_kind = 'CORRECTION' AND to_term_number = from_term_number)
  ),
  CONSTRAINT cohort_progression_events_version_ck CHECK (state_version >= 1),
  CONSTRAINT cohort_progression_events_cohort_version_uq UNIQUE (cohort_id, state_version)
);
--> statement-breakpoint


CREATE INDEX IF NOT EXISTS cohort_progression_events_cohort_time_idx
  ON cohort_progression_events(cohort_id, created_at DESC);
--> statement-breakpoint


-- Reapply unregistered DB02 overlay on top of the registered 0051 parents.
DROP TRIGGER IF EXISTS db02_cohort_progression_state_guard ON cohort_progression_state;
--> statement-breakpoint

DROP TRIGGER IF EXISTS db02_cohort_promotion_readiness_guard ON cohort_progression_state;
--> statement-breakpoint

DROP TRIGGER IF EXISTS db02_cohort_progression_history ON cohort_progression_state;
--> statement-breakpoint

DROP TRIGGER IF EXISTS db02_cohort_progression_events_immutable ON cohort_progression_events;
--> statement-breakpoint

DROP TRIGGER IF EXISTS db02_cohort_progression_events_no_truncate ON cohort_progression_events;
--> statement-breakpoint

DROP TRIGGER IF EXISTS db02_cohort_progression_initialize ON cohorts;
--> statement-breakpoint

DROP TRIGGER IF EXISTS db02_program_duration_reduction_guard ON programs;
--> statement-breakpoint

DROP FUNCTION IF EXISTS db02_guard_cohort_progression_state();
--> statement-breakpoint

DROP FUNCTION IF EXISTS db02_guard_cohort_promotion_readiness();
--> statement-breakpoint

DROP FUNCTION IF EXISTS db02_record_cohort_progression_event();
--> statement-breakpoint

DROP FUNCTION IF EXISTS db02_guard_progression_event_immutability();
--> statement-breakpoint

DROP FUNCTION IF EXISTS db02_initialize_cohort_progression_state();
--> statement-breakpoint

DROP FUNCTION IF EXISTS db02_guard_program_duration_reduction();
--> statement-breakpoint


CREATE OR REPLACE FUNCTION db02_guard_cohort_progression_state()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  max_terms integer;
  cohort_college uuid;
  period_college uuid;
  cohort_start_day date;
  cohort_end_day date;
  period_start_day date;
  period_end_day date;
  period_status academic_period_status;
BEGIN
  -- ON DELETE SET NULL on users is an identity-lifecycle mutation, not an academic
  -- correction. Allow only the FK-triggered nulling of the last-actor pointer when every
  -- canonical progression field and version are unchanged. Direct actor-only UPDATEs still
  -- arrive at trigger depth 1 and are rejected by the normal version/correction rules below.
  IF TG_OP = 'UPDATE'
     AND pg_trigger_depth() >= 2
     AND OLD.updated_by_user_id IS NOT NULL
     AND NEW.updated_by_user_id IS NULL
     AND NEW.current_term_number IS NOT DISTINCT FROM OLD.current_term_number
     AND NEW.current_academic_year_start IS NOT DISTINCT FROM OLD.current_academic_year_start
     AND NEW.current_period_id IS NOT DISTINCT FROM OLD.current_period_id
     AND NEW.version IS NOT DISTINCT FROM OLD.version THEN
    RETURN NEW;
  END IF;

  SELECT p.duration_terms, d.college_id, start_ap.start_date, end_ap.end_date
    INTO max_terms, cohort_college, cohort_start_day, cohort_end_day
    FROM cohorts c
    JOIN programs p ON p.id = c.program_id
    JOIN departments d ON d.id = p.department_id
    JOIN academic_periods start_ap ON start_ap.id = c.start_period_id
    LEFT JOIN academic_periods end_ap ON end_ap.id = c.expected_end_period_id
   WHERE c.id = NEW.cohort_id
   FOR UPDATE OF c
   FOR SHARE OF p;

  IF max_terms IS NULL OR cohort_college IS NULL THEN
    RAISE EXCEPTION 'Unknown cohort/program scope' USING ERRCODE='23503';
  END IF;

  IF NEW.current_term_number > max_terms THEN
    RAISE EXCEPTION 'Cohort term exceeds program duration'
      USING ERRCODE='23514';
  END IF;

  IF NEW.current_period_id IS NOT NULL THEN
    SELECT ap.college_id, ap.start_date, ap.end_date, ap.status
      INTO period_college, period_start_day, period_end_day, period_status
      FROM academic_periods ap
     WHERE ap.id = NEW.current_period_id
     FOR SHARE OF ap;
    IF period_college IS NULL THEN
      RAISE EXCEPTION 'Unknown academic period' USING ERRCODE='23503';
    END IF;
    IF period_college <> cohort_college THEN
      RAISE EXCEPTION 'Cohort and academic period must belong to the same college'
        USING ERRCODE='23514';
    END IF;
    IF period_status = 'CLOSED'
       AND (
         TG_OP = 'INSERT'
         OR NEW.current_term_number IS DISTINCT FROM OLD.current_term_number
         OR NEW.current_period_id IS DISTINCT FROM OLD.current_period_id
       ) THEN
      RAISE EXCEPTION 'Cohort progression cannot advance or move into a closed academic period'
        USING ERRCODE='23514';
    END IF;
    IF period_start_day < cohort_start_day
       OR (cohort_end_day IS NOT NULL AND period_end_day > cohort_end_day) THEN
      RAISE EXCEPTION 'Cohort progression period must stay inside the cohort period window'
        USING ERRCODE='23514';
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.current_term_number <> 1 OR NEW.version <> 0 THEN
      RAISE EXCEPTION 'New cohort progression must start at term 1, version 0'
        USING ERRCODE='23514';
    END IF;
  ELSE
    IF NEW.version <> OLD.version + 1 THEN
      RAISE EXCEPTION 'Cohort progression version must increment exactly once'
        USING ERRCODE='23514';
    END IF;

    IF NEW.current_term_number = OLD.current_term_number THEN
      IF NEW.current_academic_year_start IS NOT DISTINCT FROM OLD.current_academic_year_start
         AND NEW.current_period_id IS NOT DISTINCT FROM OLD.current_period_id THEN
        RAISE EXCEPTION 'Cohort correction must change academic year or period'
          USING ERRCODE='23514';
      END IF;
    ELSIF NEW.current_term_number <> OLD.current_term_number + 1 THEN
      RAISE EXCEPTION 'Cohort promotion must advance exactly one term; direct semester correction is forbidden'
        USING ERRCODE='23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_cohort_progression_state_guard
BEFORE INSERT OR UPDATE OF current_term_number, current_academic_year_start, current_period_id, version, updated_by_user_id
ON cohort_progression_state
FOR EACH ROW EXECUTE FUNCTION db02_guard_cohort_progression_state();
--> statement-breakpoint


-- Source-parity semester promotion curriculum-readiness guard.
-- Contract boundary: the application promotion writer must use a
-- version=:expectedVersion CAS predicate and atomically return a conflict
-- when another actor wins. This SQL trigger enforces readiness on direct
-- writes, but MUST NOT be mistaken for application optimistic concurrency.
-- Staffing readiness is informational: lack of assigned faculty must not
-- prevent otherwise valid curriculum promotion.
-- Faculty-teaching assignment deactivation must remain transactional
-- with the owning role/membership status change; this trigger cannot
-- prove that service-layer transition.
CREATE OR REPLACE FUNCTION db02_guard_cohort_promotion_readiness()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_program_id uuid;
  v_cohort_status cohort_status;
  v_term_id uuid;
  v_term_active boolean;
BEGIN
  IF NEW.current_term_number IS NOT DISTINCT FROM OLD.current_term_number THEN
    RETURN NEW;
  END IF;

  -- The canonical progression trigger separately rejects jumps and backward
  -- moves. Recheck source state here to fail closed even under direct SQL.
  SELECT c.program_id, c.status
    INTO v_program_id, v_cohort_status
    FROM cohorts c
   WHERE c.id = NEW.cohort_id
   FOR SHARE;

  IF v_program_id IS NULL THEN
    RAISE EXCEPTION 'Unknown cohort for promotion readiness'
      USING ERRCODE = '23503';
  END IF;

  IF v_cohort_status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'Cohort must be ACTIVE to advance academic term'
      USING ERRCODE = '23514';
  END IF;

  -- Lock the destination term row: deactivating it concurrently must serialize
  -- with promotion. Never accept a college-scoped academic_period as a substitute
  -- for this program-specific curriculum term identity.
  SELECT pt.id, pt.is_active
    INTO v_term_id, v_term_active
    FROM program_terms pt
   WHERE pt.program_id = v_program_id
     AND pt.term_number = NEW.current_term_number
   FOR SHARE;

  IF v_term_id IS NULL OR v_term_active IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Promotion target program term must be configured and ACTIVE'
      USING ERRCODE = '23514';
  END IF;

  -- Lock one stable curriculum row for the remainder of this transaction.
  -- Concurrent deletion of the LAST course row cannot invalidate readiness
  -- before this promotion commits. A different course row is also acceptable;
  -- mapped course count must be >=1, not necessarily CORE-only.
  PERFORM 1
    FROM program_term_courses ptc
   WHERE ptc.program_term_id = v_term_id
   ORDER BY ptc.id
   LIMIT 1
   FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Promotion target term requires at least one mapped course'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint

CREATE OR REPLACE TRIGGER db02_cohort_promotion_readiness_guard
BEFORE UPDATE OF current_term_number
ON cohort_progression_state
FOR EACH ROW EXECUTE FUNCTION db02_guard_cohort_promotion_readiness();
--> statement-breakpoint



-- Database-owned history: a direct SQL update cannot advance canonical state without
-- producing a matching immutable event. Application code must NOT insert a duplicate event.
CREATE OR REPLACE FUNCTION db02_record_cohort_progression_event()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO cohort_progression_events (
    cohort_id,
    from_term_number,
    to_term_number,
    from_academic_year_start,
    to_academic_year_start,
    from_period_id,
    to_period_id,
    actor_user_id,
    event_kind,
    reason,
    state_version
  ) VALUES (
    NEW.cohort_id,
    OLD.current_term_number,
    NEW.current_term_number,
    OLD.current_academic_year_start,
    NEW.current_academic_year_start,
    OLD.current_period_id,
    NEW.current_period_id,
    NEW.updated_by_user_id,
    CASE
      WHEN NEW.current_term_number = OLD.current_term_number THEN 'CORRECTION'
      ELSE 'PROMOTION'
    END,
    CASE
      WHEN NEW.current_term_number = OLD.current_term_number THEN 'COHORT_CORRECTION'
      ELSE 'COHORT_PROMOTION'
    END,
    NEW.version
  );
  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_cohort_progression_history
AFTER UPDATE OF current_term_number, current_academic_year_start, current_period_id, version
ON cohort_progression_state
FOR EACH ROW EXECUTE FUNCTION db02_record_cohort_progression_event();
--> statement-breakpoint


-- State updates still need a compare-and-set predicate (cohort_id + expected version)
-- in the service transaction. The DB trigger guarantees monotonicity/version/history;
-- the update predicate decides the single concurrent winner.

-- An explicit event is only valid when written by the cohort-state AFTER UPDATE
-- trigger. Application accounts must not forge, mutate or delete the audit trail.
-- This is a staging defense, not a substitute for restricting schema/DDL privileges.
CREATE OR REPLACE FUNCTION db02_guard_progression_event_immutability()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' AND pg_trigger_depth() >= 2 THEN
    RETURN NEW;
  END IF;

  -- ON DELETE SET NULL from users is the only permitted mutation of an existing event.
  -- It preserves the immutable academic fact while allowing identity lifecycle cleanup.
  IF TG_OP = 'UPDATE'
     AND pg_trigger_depth() >= 2
     AND OLD.actor_user_id IS NOT NULL
     AND NEW.actor_user_id IS NULL
     AND (to_jsonb(NEW) - 'actor_user_id') = (to_jsonb(OLD) - 'actor_user_id') THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Cohort progression events are database-owned and immutable'
    USING ERRCODE = '23514';
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_cohort_progression_events_immutable
BEFORE INSERT OR UPDATE OR DELETE ON cohort_progression_events
FOR EACH ROW EXECUTE FUNCTION db02_guard_progression_event_immutability();
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_cohort_progression_events_no_truncate
BEFORE TRUNCATE ON cohort_progression_events
FOR EACH STATEMENT EXECUTE FUNCTION db02_guard_progression_event_immutability();
--> statement-breakpoint


-- Ensure every newly created cohort has exactly one canonical term/year row.
-- The initial July-boundary year is only a default; an explicit user-supplied
-- legacy year override still needs a reviewed cohort creation API contract.
CREATE OR REPLACE FUNCTION db02_initialize_cohort_progression_state()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  start_day date;
  start_year integer;
BEGIN
  SELECT start_date INTO start_day FROM academic_periods
   WHERE id = NEW.start_period_id;
  IF start_day IS NULL THEN
    RAISE EXCEPTION 'Cohort start academic period is missing'
      USING ERRCODE = '23503';
  END IF;
  start_year := EXTRACT(YEAR FROM start_day)::integer;
  IF EXTRACT(MONTH FROM start_day) < 7 THEN
    start_year := start_year - 1;
  END IF;
  INSERT INTO cohort_progression_state (
    cohort_id, current_term_number, current_academic_year_start,
    current_period_id, version
  ) VALUES (NEW.id, 1, start_year, NEW.start_period_id, 0);
  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_cohort_progression_initialize
AFTER INSERT ON cohorts
FOR EACH ROW EXECUTE FUNCTION db02_initialize_cohort_progression_state();
--> statement-breakpoint


-- A program cannot shrink below an existing term or promoted cohort.
-- Program term inserts and cohort promotion also lock the program row FOR SHARE,
-- serializing concurrent duration reduction with active academic writes.
CREATE OR REPLACE FUNCTION db02_guard_program_duration_reduction()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.duration_terms < OLD.duration_terms THEN
    IF EXISTS (
      SELECT 1 FROM program_terms pt
       WHERE pt.program_id = NEW.id AND pt.term_number > NEW.duration_terms
    ) OR EXISTS (
      SELECT 1 FROM cohort_progression_state cps
      JOIN cohorts c ON c.id = cps.cohort_id
       WHERE c.program_id = NEW.id
         AND cps.current_term_number > NEW.duration_terms
    ) THEN
      RAISE EXCEPTION 'Program duration cannot exclude configured terms or promoted cohorts'
        USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_program_duration_reduction_guard
BEFORE UPDATE OF duration_terms ON programs
FOR EACH ROW EXECUTE FUNCTION db02_guard_program_duration_reduction();
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- 3) Lecture halls as tenant-owned resources
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lecture_halls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  department_id uuid REFERENCES departments(id) ON DELETE RESTRICT,
  name varchar(255) NOT NULL,
  capacity integer NOT NULL,
  description varchar(255),
  room_type varchar(64) NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lecture_halls_name_ck CHECK (btrim(name) <> ''),
  CONSTRAINT lecture_halls_capacity_ck CHECK (capacity BETWEEN 1 AND 5000),
  CONSTRAINT lecture_halls_room_type_ck CHECK (room_type IN ('CLASSROOM','LECTURE_HALL','LAB','SEMINAR_HALL','AUDITORIUM','CONFERENCE_ROOM')),
  CONSTRAINT lecture_halls_status_ck CHECK (status IN ('ACTIVE','ARCHIVED'))
);
--> statement-breakpoint


CREATE UNIQUE INDEX IF NOT EXISTS lecture_halls_active_college_name_uq
  ON lecture_halls(college_id, lower(name))
  WHERE status = 'ACTIVE';
--> statement-breakpoint


CREATE INDEX IF NOT EXISTS lecture_halls_department_idx
  ON lecture_halls(department_id, status);
--> statement-breakpoint


-- Refresh registered lecture-hall and faculty guards in disposable staging only.
DROP TRIGGER IF EXISTS db02_lecture_hall_department_guard ON lecture_halls;
--> statement-breakpoint

DROP TRIGGER IF EXISTS db02_schedule_hall_tenant_guard ON section_schedule_events;
--> statement-breakpoint

DROP TRIGGER IF EXISTS db02_lecture_hall_archive_guard ON lecture_halls;
--> statement-breakpoint

DROP TRIGGER IF EXISTS db02_section_faculty_assignment_scope_guard ON section_faculty_assignments;
--> statement-breakpoint

DROP TRIGGER IF EXISTS db02_course_teaching_assignment_scope_guard ON course_teaching_assignments;
--> statement-breakpoint

DROP FUNCTION IF EXISTS db02_guard_lecture_hall_department();
--> statement-breakpoint

DROP FUNCTION IF EXISTS db02_guard_schedule_hall_tenant();
--> statement-breakpoint

DROP FUNCTION IF EXISTS db02_guard_lecture_hall_archive();
--> statement-breakpoint

DROP FUNCTION IF EXISTS db02_guard_section_faculty_assignment_scope();
--> statement-breakpoint

DROP FUNCTION IF EXISTS db02_guard_course_teaching_assignment_scope();
--> statement-breakpoint


CREATE OR REPLACE FUNCTION db02_guard_lecture_hall_department()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  department_college uuid;
BEGIN
  IF NEW.department_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT college_id INTO department_college FROM departments WHERE id=NEW.department_id;
  IF department_college IS NULL THEN
    RAISE EXCEPTION 'Unknown lecture hall department' USING ERRCODE='23503';
  END IF;
  IF department_college <> NEW.college_id THEN
    RAISE EXCEPTION 'Lecture hall department must belong to the same college'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_lecture_hall_department_guard
BEFORE INSERT OR UPDATE OF college_id, department_id ON lecture_halls
FOR EACH ROW EXECUTE FUNCTION db02_guard_lecture_hall_department();
--> statement-breakpoint


ALTER TABLE section_schedule_events
  ADD COLUMN IF NOT EXISTS lecture_hall_id uuid REFERENCES lecture_halls(id) ON DELETE RESTRICT;
--> statement-breakpoint


CREATE INDEX IF NOT EXISTS section_schedule_events_hall_time_idx
  ON section_schedule_events(lecture_hall_id, starts_at, ends_at)
  WHERE lecture_hall_id IS NOT NULL AND status = 'SCHEDULED';
--> statement-breakpoint


CREATE OR REPLACE FUNCTION db02_guard_schedule_hall_tenant()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  section_college uuid;
  section_status_value section_status;
  faculty_college uuid;
  hall_college uuid;
BEGIN
  SELECT d.college_id, s.status
    INTO section_college, section_status_value
    FROM sections s
    JOIN cohorts c ON c.id = s.cohort_id
    JOIN programs p ON p.id = c.program_id
    JOIN departments d ON d.id = p.department_id
   WHERE s.id = NEW.section_id
   FOR SHARE OF s;

  IF section_college IS NULL THEN
    RAISE EXCEPTION 'Unknown schedule section scope' USING ERRCODE = '23503';
  END IF;

  IF NEW.status = 'SCHEDULED' AND section_status_value IS DISTINCT FROM 'ACTIVE' THEN
    RAISE EXCEPTION 'Scheduled event requires an ACTIVE section'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.faculty_membership_id IS NOT NULL THEN
    SELECT college_id INTO faculty_college
      FROM college_memberships
     WHERE id = NEW.faculty_membership_id AND status = 'ACTIVE'
     FOR SHARE;
    IF faculty_college IS NULL THEN
      RAISE EXCEPTION 'Unknown or inactive faculty membership' USING ERRCODE = '23503';
    END IF;

    PERFORM 1
      FROM membership_roles mr
     WHERE mr.membership_id = NEW.faculty_membership_id
       AND mr.role = 'FACULTY'
     FOR SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Scheduled instructor must have the FACULTY role'
        USING ERRCODE = '23514';
    END IF;
    IF faculty_college <> section_college THEN
      RAISE EXCEPTION 'Schedule faculty must belong to the section college'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  IF NEW.lecture_hall_id IS NOT NULL THEN
    SELECT college_id INTO hall_college
      FROM lecture_halls
     WHERE id = NEW.lecture_hall_id
       AND (status = 'ACTIVE' OR NEW.status = 'CANCELLED')
     FOR SHARE;
    IF hall_college IS NULL THEN
      RAISE EXCEPTION 'Unknown or inactive lecture hall' USING ERRCODE = '23503';
    END IF;
    IF section_college <> hall_college THEN
      RAISE EXCEPTION 'Schedule section and lecture hall must belong to the same college'
        USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_schedule_hall_tenant_guard
BEFORE INSERT OR UPDATE OF section_id, faculty_membership_id, lecture_hall_id, status, starts_at, ends_at
ON section_schedule_events
FOR EACH ROW EXECUTE FUNCTION db02_guard_schedule_hall_tenant();
--> statement-breakpoint


-- Serialize hall archival with booking creation. The schedule trigger takes FOR SHARE on the
-- hall; an archive UPDATE takes the conflicting row lock. Whichever wins first determines the
-- valid result without allowing an ACTIVE future booking to reference an archived hall.
CREATE OR REPLACE FUNCTION db02_guard_lecture_hall_archive()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'ACTIVE' AND NEW.status = 'ARCHIVED' AND EXISTS (
    SELECT 1
      FROM section_schedule_events e
     WHERE e.lecture_hall_id = OLD.id
       AND e.status = 'SCHEDULED'
       AND e.ends_at > now()
  ) THEN
    RAISE EXCEPTION 'Cannot archive lecture hall with active or future scheduled sessions'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_lecture_hall_archive_guard
BEFORE UPDATE OF status ON lecture_halls
FOR EACH ROW EXECUTE FUNCTION db02_guard_lecture_hall_archive();
--> statement-breakpoint


-- PostgreSQL overlap invariants. Chat 1 must confirm btree_gist is available in the
-- target Cloud SQL/PostgreSQL environment before registering this section.
CREATE EXTENSION IF NOT EXISTS btree_gist;
--> statement-breakpoint


ALTER TABLE section_schedule_events DROP CONSTRAINT IF EXISTS section_schedule_events_section_no_overlap_excl;
--> statement-breakpoint

ALTER TABLE section_schedule_events DROP CONSTRAINT IF EXISTS section_schedule_events_faculty_no_overlap_excl;
--> statement-breakpoint

ALTER TABLE section_schedule_events DROP CONSTRAINT IF EXISTS section_schedule_events_hall_no_overlap_excl;
--> statement-breakpoint


ALTER TABLE section_schedule_events
  ADD CONSTRAINT section_schedule_events_section_no_overlap_excl
  EXCLUDE USING gist (
    section_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  ) WHERE (status = 'SCHEDULED');
--> statement-breakpoint


ALTER TABLE section_schedule_events
  ADD CONSTRAINT section_schedule_events_faculty_no_overlap_excl
  EXCLUDE USING gist (
    faculty_membership_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  ) WHERE (status = 'SCHEDULED' AND faculty_membership_id IS NOT NULL);
--> statement-breakpoint


ALTER TABLE section_schedule_events
  ADD CONSTRAINT section_schedule_events_hall_no_overlap_excl
  EXCLUDE USING gist (
    lecture_hall_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  ) WHERE (status = 'SCHEDULED' AND lecture_hall_id IS NOT NULL);
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- 3a) Section faculty assignment tenant/role integrity
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION db02_guard_section_faculty_assignment_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  section_college uuid;
  section_status_value section_status;
  membership_college uuid;
  membership_status_value membership_status;
BEGIN
  SELECT d.college_id, s.status
    INTO section_college, section_status_value
    FROM sections s
    JOIN cohorts c ON c.id = s.cohort_id
    JOIN programs p ON p.id = c.program_id
    JOIN departments d ON d.id = p.department_id
   WHERE s.id = NEW.section_id
   FOR SHARE OF s;

  SELECT cm.college_id, cm.status
    INTO membership_college, membership_status_value
    FROM college_memberships cm
   WHERE cm.id = NEW.membership_id
   FOR SHARE;

  IF section_college IS NULL OR membership_college IS NULL THEN
    RAISE EXCEPTION 'Unknown section or faculty membership'
      USING ERRCODE = '23503';
  END IF;

  IF section_college <> membership_college THEN
    RAISE EXCEPTION 'Section faculty assignment must stay within one college'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.ended_at IS NULL THEN
    IF section_status_value IS DISTINCT FROM 'ACTIVE'
       OR membership_status_value IS DISTINCT FROM 'ACTIVE' THEN
      RAISE EXCEPTION 'Active section faculty assignment requires ACTIVE section and membership'
        USING ERRCODE = '23514';
    END IF;

    PERFORM 1
      FROM membership_roles mr
     WHERE mr.membership_id = NEW.membership_id
       AND mr.role = 'FACULTY'
     FOR SHARE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Section faculty assignment requires FACULTY role'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_section_faculty_assignment_scope_guard
BEFORE INSERT OR UPDATE OF section_id, membership_id, ended_at
ON section_faculty_assignments
FOR EACH ROW EXECUTE FUNCTION db02_guard_section_faculty_assignment_scope();
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- 3b) Course teaching assignment tenant/role integrity
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION db02_guard_course_teaching_assignment_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  delivery_college uuid;
  delivery_ended_at timestamptz;
  offering_status_value course_offering_status;
  course_status_value course_status;
  section_status_value section_status;
  membership_college uuid;
  membership_status_value membership_status;
BEGIN
  SELECT d.college_id, csd.ended_at, co.status, crs.status, s.status
    INTO delivery_college, delivery_ended_at, offering_status_value,
         course_status_value, section_status_value
    FROM course_section_deliveries csd
    JOIN course_offerings co ON co.id = csd.offering_id
    JOIN courses crs ON crs.id = co.course_id
    JOIN sections s ON s.id = csd.section_id
    JOIN cohorts c ON c.id = co.cohort_id
    JOIN programs p ON p.id = c.program_id
    JOIN departments d ON d.id = p.department_id
   WHERE csd.id = NEW.delivery_id
   FOR SHARE OF csd, co, crs, s;

  SELECT cm.college_id, cm.status
    INTO membership_college, membership_status_value
    FROM college_memberships cm
   WHERE cm.id = NEW.membership_id
   FOR SHARE;

  IF delivery_college IS NULL OR membership_college IS NULL THEN
    RAISE EXCEPTION 'Unknown delivery or faculty membership'
      USING ERRCODE = '23503';
  END IF;

  IF delivery_college <> membership_college THEN
    RAISE EXCEPTION 'Course teaching assignment must stay within one college'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.ended_at IS NULL THEN
    IF delivery_ended_at IS NOT NULL
       OR offering_status_value IS DISTINCT FROM 'ACTIVE'
       OR course_status_value IS DISTINCT FROM 'ACTIVE'
       OR section_status_value IS DISTINCT FROM 'ACTIVE'
       OR membership_status_value IS DISTINCT FROM 'ACTIVE' THEN
      RAISE EXCEPTION 'Active teaching assignment requires active delivery chain and membership'
        USING ERRCODE = '23514';
    END IF;

    PERFORM 1
      FROM membership_roles mr
     WHERE mr.membership_id = NEW.membership_id
       AND mr.role = 'FACULTY'
     FOR SHARE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Course teaching assignment requires FACULTY role'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_course_teaching_assignment_scope_guard
BEFORE INSERT OR UPDATE OF delivery_id, membership_id, ended_at
ON course_teaching_assignments
FOR EACH ROW EXECUTE FUNCTION db02_guard_course_teaching_assignment_scope();
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- 4) Broad faculty-course association pool
-- ---------------------------------------------------------------------------
-- Distinct from course_teaching_assignments: legacy admins can associate faculty with a
-- course before a class/delivery assignment exists, and course-scoped flows query this pool.
CREATE TABLE IF NOT EXISTS faculty_course_associations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id uuid NOT NULL REFERENCES college_memberships(id) ON DELETE RESTRICT,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT faculty_course_associations_lifecycle_ck
    CHECK (ended_at IS NULL OR ended_at >= started_at)
);
--> statement-breakpoint


CREATE UNIQUE INDEX IF NOT EXISTS faculty_course_associations_active_uq
  ON faculty_course_associations(membership_id, course_id)
  WHERE ended_at IS NULL;
--> statement-breakpoint


CREATE INDEX IF NOT EXISTS faculty_course_associations_course_active_idx
  ON faculty_course_associations(course_id, membership_id)
  WHERE ended_at IS NULL;
--> statement-breakpoint


-- Registered in 0053; refresh only in disposable staging overlay.
DROP TRIGGER IF EXISTS db02_faculty_course_association_scope_guard ON faculty_course_associations;
--> statement-breakpoint

DROP TRIGGER IF EXISTS db02_faculty_course_associations_role_removal ON membership_roles;
--> statement-breakpoint

DROP TRIGGER IF EXISTS db02_faculty_course_associations_membership_inactive ON college_memberships;
--> statement-breakpoint

DROP TRIGGER IF EXISTS db02_faculty_course_associations_course_archive ON courses;
--> statement-breakpoint

DROP FUNCTION IF EXISTS db02_guard_faculty_course_association_scope();
--> statement-breakpoint

DROP FUNCTION IF EXISTS db02_end_faculty_course_associations_on_role_removal();
--> statement-breakpoint

DROP FUNCTION IF EXISTS db02_end_faculty_course_associations_on_membership_inactive();
--> statement-breakpoint

DROP FUNCTION IF EXISTS db02_end_faculty_course_associations_on_course_archive();
--> statement-breakpoint


CREATE OR REPLACE FUNCTION db02_guard_faculty_course_association_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  membership_college uuid;
  membership_status_value membership_status;
  course_college uuid;
  course_status_value course_status;
BEGIN
  SELECT cm.college_id, cm.status
    INTO membership_college, membership_status_value
    FROM college_memberships cm
   WHERE cm.id = NEW.membership_id
   FOR SHARE;

  SELECT d.college_id, c.status
    INTO course_college, course_status_value
    FROM courses c
    JOIN departments d ON d.id = c.department_id
   WHERE c.id = NEW.course_id
   FOR SHARE OF c;

  IF membership_college IS NULL OR course_college IS NULL THEN
    RAISE EXCEPTION 'Unknown faculty membership or course'
      USING ERRCODE = '23503';
  END IF;

  IF membership_college <> course_college THEN
    RAISE EXCEPTION 'Faculty-course association must stay within one college'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.ended_at IS NULL THEN
    IF membership_status_value IS DISTINCT FROM 'ACTIVE'
       OR course_status_value IS DISTINCT FROM 'ACTIVE' THEN
      RAISE EXCEPTION 'Active faculty-course association requires ACTIVE membership and course'
        USING ERRCODE = '23514';
    END IF;

    PERFORM 1
      FROM membership_roles mr
     WHERE mr.membership_id = NEW.membership_id
       AND mr.role = 'FACULTY'
     FOR SHARE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Faculty-course association requires FACULTY role'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_faculty_course_association_scope_guard
BEFORE INSERT OR UPDATE OF membership_id, course_id
ON faculty_course_associations
FOR EACH ROW EXECUTE FUNCTION db02_guard_faculty_course_association_scope();
--> statement-breakpoint


-- Keep association lifecycle valid when identity state changes after association creation.
-- The insert/update guard alone is insufficient: admins can later remove FACULTY or suspend/end
-- the membership. These AFTER triggers close active associations in the same transaction.
CREATE OR REPLACE FUNCTION db02_end_faculty_course_associations_on_role_removal()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.role = 'FACULTY' THEN
    UPDATE faculty_course_associations
       SET ended_at = COALESCE(ended_at, now()),
           updated_at = now()
     WHERE membership_id = OLD.membership_id
       AND ended_at IS NULL;

    UPDATE course_teaching_assignments
       SET ended_at = COALESCE(ended_at, now()),
           updated_at = now()
     WHERE membership_id = OLD.membership_id
       AND ended_at IS NULL;

    UPDATE section_faculty_assignments
       SET ended_at = COALESCE(ended_at, now()),
           updated_at = now()
     WHERE membership_id = OLD.membership_id
       AND ended_at IS NULL;

    UPDATE section_schedule_events
       SET faculty_membership_id = NULL,
           updated_at = now()
     WHERE faculty_membership_id = OLD.membership_id
       AND status = 'SCHEDULED'
       AND ends_at > now();
  END IF;
  RETURN OLD;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_faculty_course_associations_role_removal
AFTER DELETE ON membership_roles
FOR EACH ROW EXECUTE FUNCTION db02_end_faculty_course_associations_on_role_removal();
--> statement-breakpoint


CREATE OR REPLACE FUNCTION db02_end_faculty_course_associations_on_membership_inactive()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'ACTIVE' AND NEW.status <> 'ACTIVE' THEN
    UPDATE faculty_course_associations
       SET ended_at = COALESCE(ended_at, now()),
           updated_at = now()
     WHERE membership_id = NEW.id
       AND ended_at IS NULL;

    UPDATE course_teaching_assignments
       SET ended_at = COALESCE(ended_at, now()),
           updated_at = now()
     WHERE membership_id = NEW.id
       AND ended_at IS NULL;

    UPDATE section_faculty_assignments
       SET ended_at = COALESCE(ended_at, now()),
           updated_at = now()
     WHERE membership_id = NEW.id
       AND ended_at IS NULL;

    UPDATE section_schedule_events
       SET faculty_membership_id = NULL,
           updated_at = now()
     WHERE faculty_membership_id = NEW.id
       AND status = 'SCHEDULED'
       AND ends_at > now();
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_faculty_course_associations_membership_inactive
AFTER UPDATE OF status ON college_memberships
FOR EACH ROW EXECUTE FUNCTION db02_end_faculty_course_associations_on_membership_inactive();
--> statement-breakpoint


CREATE OR REPLACE FUNCTION db02_end_faculty_course_associations_on_course_archive()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'ACTIVE' AND NEW.status <> 'ACTIVE' THEN
    UPDATE faculty_course_associations
       SET ended_at = COALESCE(ended_at, now()),
           updated_at = now()
     WHERE course_id = NEW.id
       AND ended_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_faculty_course_associations_course_archive
AFTER UPDATE OF status ON courses
FOR EACH ROW EXECUTE FUNCTION db02_end_faculty_course_associations_on_course_archive();
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- 5) Remaining parent/enrollment/history integrity
-- ---------------------------------------------------------------------------
-- ---------------------------------------------------------------------------
-- 5a) Remaining tenant-owner roots are immutable
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION db02_guard_remaining_college_owner_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.college_id IS DISTINCT FROM OLD.college_id THEN
    RAISE EXCEPTION 'DB02 tenant owner college cannot change in place'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_academic_period_college_immutable
BEFORE UPDATE OF college_id ON academic_periods
FOR EACH ROW EXECUTE FUNCTION db02_guard_remaining_college_owner_immutable();
--> statement-breakpoint


-- Period dates may be edited while a PLANNED period is unused. Once academic state points
-- at the period, changing its boundaries would reinterpret cohort/section/offering history.
-- Child writers lock the period row before validation so this rule is race-safe.
CREATE OR REPLACE FUNCTION db02_guard_academic_period_date_history()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.start_date IS NOT DISTINCT FROM OLD.start_date
     AND NEW.end_date IS NOT DISTINCT FROM OLD.end_date THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
       SELECT 1 FROM cohorts
        WHERE start_period_id = OLD.id OR expected_end_period_id = OLD.id
     )
     OR EXISTS (SELECT 1 FROM sections WHERE academic_period_id = OLD.id)
     OR EXISTS (SELECT 1 FROM course_offerings WHERE academic_period_id = OLD.id)
     OR EXISTS (SELECT 1 FROM cohort_progression_state WHERE current_period_id = OLD.id)
  THEN
    RAISE EXCEPTION 'Academic period dates cannot change after academic state references the period'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_academic_period_date_history_guard
BEFORE UPDATE OF start_date, end_date ON academic_periods
FOR EACH ROW EXECUTE FUNCTION db02_guard_academic_period_date_history();
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_membership_college_immutable
BEFORE UPDATE OF college_id ON college_memberships
FOR EACH ROW EXECUTE FUNCTION db02_guard_remaining_college_owner_immutable();
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_lecture_hall_college_immutable
BEFORE UPDATE OF college_id ON lecture_halls
FOR EACH ROW EXECUTE FUNCTION db02_guard_remaining_college_owner_immutable();
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- 5b) Academic parent identity cannot be silently rewritten
-- ---------------------------------------------------------------------------
-- Legacy BatchService rejects moving an existing batch/cohort to another program.
-- vNext also treats the start period as creation identity. A controlled transfer must
-- create explicit history instead of rewriting the parent keys in place.
DROP TRIGGER IF EXISTS db02_cohort_program_immutable ON cohorts;
--> statement-breakpoint

DROP FUNCTION IF EXISTS db02_guard_cohort_parent_immutable();
--> statement-breakpoint

CREATE OR REPLACE FUNCTION db02_guard_cohort_parent_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.program_id IS DISTINCT FROM OLD.program_id
     OR NEW.start_period_id IS DISTINCT FROM OLD.start_period_id THEN
    RAISE EXCEPTION 'DB02 cohort program/start period are immutable; use a controlled transfer'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_cohort_program_immutable
BEFORE UPDATE OF program_id, start_period_id ON cohorts
FOR EACH ROW EXECUTE FUNCTION db02_guard_cohort_parent_immutable();
--> statement-breakpoint


CREATE OR REPLACE FUNCTION db02_guard_program_term_identity_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.program_id IS DISTINCT FROM OLD.program_id
     OR NEW.term_number IS DISTINCT FROM OLD.term_number THEN
    RAISE EXCEPTION 'DB02 program term identity is immutable'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint


DROP TRIGGER IF EXISTS db02_program_term_identity_immutable ON program_terms;
--> statement-breakpoint

CREATE OR REPLACE TRIGGER db02_program_term_identity_immutable
BEFORE UPDATE OF program_id, term_number ON program_terms
FOR EACH ROW EXECUTE FUNCTION db02_guard_program_term_identity_immutable();
--> statement-breakpoint


-- An unused program term may be deleted, preserving legacy admin cleanup. Once canonical
-- cohort progression currently occupies or has historically traversed the term number for
-- this program, hard deletion would erase the reusable semester definition beneath history.
-- Deactivation remains separately editable; this guard is delete-only.
CREATE OR REPLACE FUNCTION db02_guard_program_term_delete_history()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (
       SELECT 1
         FROM cohort_progression_state cps
         JOIN cohorts c ON c.id = cps.cohort_id
        WHERE c.program_id = OLD.program_id
          AND cps.current_term_number = OLD.term_number
     )
     OR EXISTS (
       SELECT 1
         FROM cohort_progression_events cpe
         JOIN cohorts c ON c.id = cpe.cohort_id
        WHERE c.program_id = OLD.program_id
          AND (
            cpe.from_term_number = OLD.term_number
            OR cpe.to_term_number = OLD.term_number
          )
     ) THEN
    RAISE EXCEPTION 'Program term cannot be deleted after cohort progression references it'
      USING ERRCODE = '23514';
  END IF;

  RETURN OLD;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_program_term_delete_history_guard
BEFORE DELETE ON program_terms
FOR EACH ROW EXECUTE FUNCTION db02_guard_program_term_delete_history();
--> statement-breakpoint


-- Empty sections may still be reparented within the canonical same-college/window rules.
-- Once any learner/faculty/delivery/schedule history exists, structural movement requires an
-- explicit controlled-transfer workflow so prior history is not silently reinterpreted.
CREATE OR REPLACE FUNCTION db02_guard_section_history_reparent()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (
    NEW.cohort_id IS DISTINCT FROM OLD.cohort_id
    OR NEW.academic_period_id IS DISTINCT FROM OLD.academic_period_id
  ) AND (
    EXISTS (SELECT 1 FROM section_enrollments WHERE section_id = OLD.id)
    OR EXISTS (SELECT 1 FROM section_faculty_assignments WHERE section_id = OLD.id)
    OR EXISTS (SELECT 1 FROM course_section_deliveries WHERE section_id = OLD.id)
    OR EXISTS (SELECT 1 FROM section_schedule_events WHERE section_id = OLD.id)
  ) THEN
    RAISE EXCEPTION 'DB02 section with historical references requires controlled transfer'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_section_history_reparent_guard
BEFORE UPDATE OF cohort_id, academic_period_id ON sections
FOR EACH ROW EXECUTE FUNCTION db02_guard_section_history_reparent();
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- 5c) Learner program/section enrollment scope
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION db02_guard_learner_program_enrollment_tenant()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  membership_college uuid;
  program_college uuid;
  program_status_value program_status;
  cohort_program uuid;
  cohort_status_value cohort_status;
BEGIN
  SELECT college_id
    INTO membership_college
    FROM college_memberships
   WHERE id = NEW.membership_id
     AND status = 'ACTIVE'
   FOR SHARE;

  IF membership_college IS NULL THEN
    RAISE EXCEPTION 'DB02 learner enrollment requires active college membership'
      USING ERRCODE = '23514';
  END IF;

  PERFORM 1
    FROM membership_roles
   WHERE membership_id = NEW.membership_id
     AND role = 'LEARNER'
   FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'DB02 learner enrollment requires an active LEARNER'
      USING ERRCODE = '23514';
  END IF;

  SELECT d.college_id, p.status
    INTO program_college, program_status_value
    FROM programs p
    JOIN departments d ON d.id = p.department_id
   WHERE p.id = NEW.program_id
   FOR SHARE OF p;

  SELECT program_id, status
    INTO cohort_program, cohort_status_value
    FROM cohorts
   WHERE id = NEW.cohort_id
   FOR SHARE;

  IF program_college IS NULL
     OR cohort_program IS NULL
     OR membership_college <> program_college
     OR cohort_program <> NEW.program_id THEN
    RAISE EXCEPTION 'DB02 learner enrollment membership/program/cohort scope mismatch'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.status = 'ACTIVE'
     AND (
       program_status_value IS DISTINCT FROM 'ACTIVE'
       OR cohort_status_value NOT IN ('PLANNED','ACTIVE')
     ) THEN
    RAISE EXCEPTION 'Active learner enrollment requires ACTIVE program and PLANNED/ACTIVE cohort'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_learner_program_enrollment_tenant
BEFORE INSERT OR UPDATE OF membership_id, program_id, cohort_id
ON learner_program_enrollments
FOR EACH ROW EXECUTE FUNCTION db02_guard_learner_program_enrollment_tenant();
--> statement-breakpoint


CREATE OR REPLACE FUNCTION db02_guard_section_enrollment_cohort_period()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  learner_cohort uuid;
  learner_status_value learner_program_enrollment_status;
  target_cohort uuid;
  target_period uuid;
  target_status section_status;
  period_status_value academic_period_status;
BEGIN
  SELECT cohort_id, status
    INTO learner_cohort, learner_status_value
    FROM learner_program_enrollments
   WHERE id = NEW.learner_enrollment_id
   FOR SHARE;

  SELECT cohort_id, academic_period_id, status
    INTO target_cohort, target_period, target_status
    FROM sections
   WHERE id = NEW.section_id
   FOR SHARE;

  SELECT status
    INTO period_status_value
    FROM academic_periods
   WHERE id = NEW.academic_period_id
   FOR SHARE;

  IF learner_cohort IS NULL
     OR target_cohort IS NULL
     OR target_period IS NULL
     OR learner_cohort <> target_cohort
     OR NEW.academic_period_id <> target_period THEN
    RAISE EXCEPTION 'DB02 learner section cohort/period scope mismatch'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.status = 'ACTIVE'
     AND (
       learner_status_value IS DISTINCT FROM 'ACTIVE'
       OR target_status IS DISTINCT FROM 'ACTIVE'
       OR period_status_value = 'CLOSED'
     ) THEN
    RAISE EXCEPTION 'Active section enrollment requires ACTIVE learner program, section and period'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_section_enrollment_cohort_period
BEFORE INSERT OR UPDATE OF learner_enrollment_id, section_id, academic_period_id
ON section_enrollments
FOR EACH ROW EXECUTE FUNCTION db02_guard_section_enrollment_cohort_period();
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- 5d) Learner identity lifecycle closes active academic state
-- ---------------------------------------------------------------------------
-- Temporary membership suspension is an access-control state, not academic withdrawal.
-- Legacy batch usage still counts suspended, non-deleted learners attached to primary classes.
-- Removing LEARNER or ending the college membership is different: active section/program
-- enrollment must become historical and must not keep contributing to current cohort counts.
CREATE OR REPLACE FUNCTION db02_withdraw_learner_on_role_delete()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.role <> 'LEARNER' THEN
    RETURN OLD;
  END IF;

  UPDATE section_enrollments se
     SET status = 'WITHDRAWN',
         ended_at = COALESCE(se.ended_at, now()),
         updated_at = now()
    FROM learner_program_enrollments lpe
   WHERE lpe.id = se.learner_enrollment_id
     AND lpe.membership_id = OLD.membership_id
     AND se.status = 'ACTIVE';

  UPDATE learner_program_enrollments
     SET status = 'WITHDRAWN',
         withdrawn_at = COALESCE(withdrawn_at, now()),
         completed_at = NULL,
         updated_at = now()
   WHERE membership_id = OLD.membership_id
     AND status = 'ACTIVE';

  RETURN OLD;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_withdraw_learner_on_role_removal
AFTER DELETE ON membership_roles
FOR EACH ROW EXECUTE FUNCTION db02_withdraw_learner_on_role_delete();
--> statement-breakpoint


CREATE OR REPLACE FUNCTION db02_withdraw_learner_on_membership_end()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'ENDED' OR NEW.status <> 'ENDED' THEN
    RETURN NEW;
  END IF;

  UPDATE section_enrollments se
     SET status = 'WITHDRAWN',
         ended_at = COALESCE(se.ended_at, now()),
         updated_at = now()
    FROM learner_program_enrollments lpe
   WHERE lpe.id = se.learner_enrollment_id
     AND lpe.membership_id = NEW.id
     AND se.status = 'ACTIVE';

  UPDATE learner_program_enrollments
     SET status = 'WITHDRAWN',
         withdrawn_at = COALESCE(withdrawn_at, now()),
         completed_at = NULL,
         updated_at = now()
   WHERE membership_id = NEW.id
     AND status = 'ACTIVE';

  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_withdraw_learner_on_membership_end
AFTER UPDATE OF status ON college_memberships
FOR EACH ROW EXECUTE FUNCTION db02_withdraw_learner_on_membership_end();
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- 5e) Serialize history creation against section structural movement
-- ---------------------------------------------------------------------------
-- PostgreSQL FK inserts normally take KEY SHARE, compatible with NO KEY UPDATE.
-- Promote history-producing references to SHARE so they serialize with section reparenting
-- before the history guard decides whether a move remains legal.
CREATE OR REPLACE FUNCTION db02_lock_section_history_parent()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM 1
    FROM sections
   WHERE id = NEW.section_id
   FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'DB02 referenced section is missing'
      USING ERRCODE = '23503';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_lock_section_for_learner_enrollment
BEFORE INSERT OR UPDATE OF section_id ON section_enrollments
FOR EACH ROW EXECUTE FUNCTION db02_lock_section_history_parent();
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_lock_section_for_faculty_assignment
BEFORE INSERT OR UPDATE OF section_id ON section_faculty_assignments
FOR EACH ROW EXECUTE FUNCTION db02_lock_section_history_parent();
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_lock_section_for_course_delivery
BEFORE INSERT OR UPDATE OF section_id ON course_section_deliveries
FOR EACH ROW EXECUTE FUNCTION db02_lock_section_history_parent();
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_lock_section_for_schedule_event
BEFORE INSERT OR UPDATE OF section_id ON section_schedule_events
FOR EACH ROW EXECUTE FUNCTION db02_lock_section_history_parent();
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- 5f) Enrollment identity is historical, not mutable parentage
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION db02_guard_learner_program_enrollment_identity_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.membership_id IS DISTINCT FROM OLD.membership_id
     OR NEW.program_id IS DISTINCT FROM OLD.program_id
     OR NEW.cohort_id IS DISTINCT FROM OLD.cohort_id THEN
    RAISE EXCEPTION 'DB02 learner program enrollment identity is immutable'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_academic_enrollment_identity_immutable
BEFORE UPDATE OF membership_id, program_id, cohort_id
ON learner_program_enrollments
FOR EACH ROW EXECUTE FUNCTION db02_guard_learner_program_enrollment_identity_immutable();
--> statement-breakpoint


CREATE OR REPLACE FUNCTION db02_guard_section_enrollment_identity_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.learner_enrollment_id IS DISTINCT FROM OLD.learner_enrollment_id
     OR NEW.section_id IS DISTINCT FROM OLD.section_id
     OR NEW.academic_period_id IS DISTINCT FROM OLD.academic_period_id THEN
    RAISE EXCEPTION 'DB02 section enrollment history identity is immutable'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_section_enrollment_identity_immutable
BEFORE UPDATE OF learner_enrollment_id, section_id, academic_period_id
ON section_enrollments
FOR EACH ROW EXECUTE FUNCTION db02_guard_section_enrollment_identity_immutable();
--> statement-breakpoint



-- ---------------------------------------------------------------------------
-- 6) Final progression/schedule lifecycle integrity
-- ---------------------------------------------------------------------------
-- 6a) Canonical progression-state identity/lifecycle: the initializer creates one row per cohort.
-- A direct cohort_id change would attach progress to the wrong cohort while leaving
-- immutable event history on the old identity; DELETE/TRUNCATE would silently lose it.
CREATE OR REPLACE FUNCTION db02_guard_progression_state_identity()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'TRUNCATE' THEN
    RAISE EXCEPTION 'Canonical cohort progression state is not truncatable'
      USING ERRCODE='23514';
  END IF;

  IF TG_OP = 'DELETE' THEN
    -- ON DELETE CASCADE from cohorts is the only permitted state deletion path.
    -- Direct DELETE arrives at trigger depth 1 and remains forbidden. Any real promotion/
    -- correction history keeps the cohort itself undeletable through
    -- cohort_progression_events.cohort_id ON DELETE RESTRICT.
    IF pg_trigger_depth() >= 2 THEN
      RETURN OLD;
    END IF;

    RAISE EXCEPTION 'Canonical cohort progression state is not directly deletable'
      USING ERRCODE='23514';
  END IF;

  IF NEW.cohort_id IS DISTINCT FROM OLD.cohort_id THEN
    RAISE EXCEPTION 'Canonical cohort progression cannot switch cohort identity'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_progression_state_identity_guard
BEFORE UPDATE OF cohort_id OR DELETE ON cohort_progression_state
FOR EACH ROW EXECUTE FUNCTION db02_guard_progression_state_identity();
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_progression_state_no_truncate
BEFORE TRUNCATE ON cohort_progression_state
FOR EACH STATEMENT EXECUTE FUNCTION db02_guard_progression_state_identity();
--> statement-breakpoint


-- 6b) Prevent timestamp-only UPDATEs from resurrecting historical scheduled
-- events into future bookings on an ARCHIVED hall. The canonical tenant/hall
-- guard runs on section/actor/hall/status changes, not bare starts_at/ends_at.
-- FOR SHARE on the hall row serializes against an archive UPDATE.
CREATE OR REPLACE FUNCTION db02_guard_future_schedule_room_lifecycle()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  current_hall_status varchar(32);
BEGIN
  IF NEW.lecture_hall_id IS NULL
     OR NEW.status <> 'SCHEDULED'
     OR NEW.ends_at <= statement_timestamp() THEN
    RETURN NEW;
  END IF;
  SELECT status INTO current_hall_status
    FROM lecture_halls
   WHERE id = NEW.lecture_hall_id
   FOR SHARE;
  IF current_hall_status IS DISTINCT FROM 'ACTIVE' THEN
    RAISE EXCEPTION 'Future schedule requires an ACTIVE lecture hall'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_schedule_future_hall_lifecycle_guard
BEFORE INSERT OR UPDATE OF starts_at, ends_at, status, lecture_hall_id
ON section_schedule_events
FOR EACH ROW EXECUTE FUNCTION db02_guard_future_schedule_room_lifecycle();
--> statement-breakpoint



-- ---------------------------------------------------------------------------
-- 7) Historic parent identity and serialization
-- ---------------------------------------------------------------------------
-- Once dependent academic/attendance history exists, parent identity cannot be silently
-- rewritten. SHARE locks serialize history creation against otherwise-valid parent moves.
CREATE OR REPLACE FUNCTION db02_guard_historic_offering_parent()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (
       NEW.cohort_id,
       NEW.academic_period_id,
       NEW.course_id,
       NEW.program_term_id,
       NEW.type,
       NEW.program_term_course_id
     )
     IS DISTINCT FROM (
       OLD.cohort_id,
       OLD.academic_period_id,
       OLD.course_id,
       OLD.program_term_id,
       OLD.type,
       OLD.program_term_course_id
     )
     AND EXISTS (
       SELECT 1 FROM course_section_deliveries d WHERE d.offering_id = OLD.id
     ) THEN
    RAISE EXCEPTION 'Offering academic identity cannot change after delivery exists'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_historic_offering_parent_guard
BEFORE UPDATE OF cohort_id, academic_period_id, course_id, program_term_id, type, program_term_course_id
ON course_offerings
FOR EACH ROW EXECUTE FUNCTION db02_guard_historic_offering_parent();
--> statement-breakpoint


CREATE OR REPLACE FUNCTION db02_guard_historic_delivery_parent()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.offering_id, NEW.section_id)
     IS DISTINCT FROM (OLD.offering_id, OLD.section_id)
     AND (
       EXISTS (SELECT 1 FROM course_teaching_assignments t WHERE t.delivery_id = OLD.id)
       OR EXISTS (SELECT 1 FROM section_schedule_event_courses ec WHERE ec.delivery_id = OLD.id)
     ) THEN
    RAISE EXCEPTION 'Course delivery identity cannot change after teaching or event history'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_historic_delivery_parent_guard
BEFORE UPDATE OF offering_id, section_id
ON course_section_deliveries
FOR EACH ROW EXECUTE FUNCTION db02_guard_historic_delivery_parent();
--> statement-breakpoint


CREATE OR REPLACE FUNCTION db02_guard_historic_event_section()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.section_id IS DISTINCT FROM OLD.section_id AND (
      EXISTS (SELECT 1 FROM section_schedule_event_courses ec WHERE ec.schedule_event_id = OLD.id)
      OR EXISTS (SELECT 1 FROM attendance_sessions a WHERE a.schedule_event_id = OLD.id)
      OR EXISTS (SELECT 1 FROM attendance_records a WHERE a.schedule_event_id = OLD.id)
    ) THEN
    RAISE EXCEPTION 'Schedule event cannot move section after delivery/attendance history'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_historic_event_section_guard
BEFORE UPDATE OF section_id ON section_schedule_events
FOR EACH ROW EXECUTE FUNCTION db02_guard_historic_event_section();
--> statement-breakpoint


-- FK KEY SHARE row locks do not conflict with a non-key parent UPDATE,
-- which uses NO KEY UPDATE. Explicit SHARE locks serialize parent reparenting
-- against history insertion. The parent guard then sees committed children
-- or the child's validation runs against the committed parent.
CREATE OR REPLACE FUNCTION db02_lock_offering_for_delivery()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM 1 FROM course_offerings WHERE id = NEW.offering_id FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown historic course offering' USING ERRCODE='23503';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_delivery_parent_serialization
BEFORE INSERT OR UPDATE OF offering_id ON course_section_deliveries
FOR EACH ROW EXECUTE FUNCTION db02_lock_offering_for_delivery();
--> statement-breakpoint


CREATE OR REPLACE FUNCTION db02_lock_delivery_for_teaching()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM 1 FROM course_section_deliveries WHERE id = NEW.delivery_id FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown delivery for teaching history' USING ERRCODE='23503';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_teaching_delivery_serialization
BEFORE INSERT OR UPDATE OF delivery_id ON course_teaching_assignments
FOR EACH ROW EXECUTE FUNCTION db02_lock_delivery_for_teaching();
--> statement-breakpoint


CREATE OR REPLACE FUNCTION db02_lock_event_delivery_for_course_link()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Lock rows in fixed order to reduce multi-resource deadlock exposure.
  PERFORM 1 FROM course_section_deliveries WHERE id = NEW.delivery_id FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown delivery for scheduled course' USING ERRCODE='23503';
  END IF;
  PERFORM 1 FROM section_schedule_events WHERE id = NEW.schedule_event_id FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown schedule event for course link' USING ERRCODE='23503';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_event_course_parent_serialization
BEFORE INSERT OR UPDATE OF schedule_event_id, delivery_id ON section_schedule_event_courses
FOR EACH ROW EXECUTE FUNCTION db02_lock_event_delivery_for_course_link();
--> statement-breakpoint


CREATE OR REPLACE FUNCTION db02_lock_event_for_attendance_history()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM 1 FROM section_schedule_events WHERE id = NEW.schedule_event_id FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown schedule event for attendance history' USING ERRCODE='23503';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_attendance_session_event_serialization
BEFORE INSERT OR UPDATE OF schedule_event_id ON attendance_sessions
FOR EACH ROW EXECUTE FUNCTION db02_lock_event_for_attendance_history();
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_attendance_record_event_serialization
BEFORE INSERT OR UPDATE OF schedule_event_id ON attendance_records
FOR EACH ROW EXECUTE FUNCTION db02_lock_event_for_attendance_history();
--> statement-breakpoint



-- ---------------------------------------------------------------------------
-- 9) Active-parent transition integrity
-- ---------------------------------------------------------------------------
-- Child writers take SHARE locks on active parents. These parent transition guards therefore
-- close the opposite race ordering: if a child commits first, the parent transition rechecks
-- dependencies after waiting; if the parent commits first, the child rechecks parent status.

CREATE OR REPLACE FUNCTION db02_guard_course_archive_dependencies()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'ACTIVE'
     AND NEW.status <> 'ACTIVE'
     AND EXISTS (
       SELECT 1
         FROM course_offerings co
        WHERE co.course_id = OLD.id
          AND co.status = 'ACTIVE'
     ) THEN
    RAISE EXCEPTION 'Cannot archive course with active offerings'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_course_archive_dependency_guard
BEFORE UPDATE OF status ON courses
FOR EACH ROW EXECUTE FUNCTION db02_guard_course_archive_dependencies();
--> statement-breakpoint


CREATE OR REPLACE FUNCTION db02_guard_course_offering_archive_dependencies()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'ACTIVE'
     AND NEW.status <> 'ACTIVE'
     AND EXISTS (
       SELECT 1
         FROM course_section_deliveries csd
        WHERE csd.offering_id = OLD.id
          AND csd.ended_at IS NULL
     ) THEN
    RAISE EXCEPTION 'Cannot archive course offering with active deliveries'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_course_offering_archive_dependency_guard
BEFORE UPDATE OF status ON course_offerings
FOR EACH ROW EXECUTE FUNCTION db02_guard_course_offering_archive_dependencies();
--> statement-breakpoint


CREATE OR REPLACE FUNCTION db02_guard_delivery_end_dependencies()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.ended_at IS NULL
     AND NEW.ended_at IS NOT NULL
     AND EXISTS (
       SELECT 1
         FROM course_teaching_assignments cta
        WHERE cta.delivery_id = OLD.id
          AND cta.ended_at IS NULL
     ) THEN
    RAISE EXCEPTION 'Cannot end course delivery with active teaching assignments'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_delivery_end_dependency_guard
BEFORE UPDATE OF ended_at ON course_section_deliveries
FOR EACH ROW EXECUTE FUNCTION db02_guard_delivery_end_dependencies();
--> statement-breakpoint


CREATE OR REPLACE FUNCTION db02_guard_section_archive_dependencies()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status <> 'ACTIVE' OR NEW.status <> 'ARCHIVED' THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
       SELECT 1
         FROM section_enrollments se
        WHERE se.section_id = OLD.id
          AND se.status = 'ACTIVE'
     ) THEN
    RAISE EXCEPTION 'Cannot archive section with active learner enrollments'
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
       SELECT 1
         FROM section_faculty_assignments sfa
        WHERE sfa.section_id = OLD.id
          AND sfa.ended_at IS NULL
     ) THEN
    RAISE EXCEPTION 'Cannot archive section with active faculty assignments'
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
       SELECT 1
         FROM course_section_deliveries csd
        WHERE csd.section_id = OLD.id
          AND csd.ended_at IS NULL
     ) THEN
    RAISE EXCEPTION 'Cannot archive section with active course deliveries'
      USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
       SELECT 1
         FROM section_schedule_events e
        WHERE e.section_id = OLD.id
          AND e.status = 'SCHEDULED'
          AND e.ends_at > statement_timestamp()
     ) THEN
    RAISE EXCEPTION 'Cannot archive section with active or future scheduled sessions'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_section_archive_dependency_guard
BEFORE UPDATE OF status ON sections
FOR EACH ROW EXECUTE FUNCTION db02_guard_section_archive_dependencies();
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- Registration / acceptance notes
-- ---------------------------------------------------------------------------
-- Before registration:
-- 1. Reconcile against latest main and any Chat 1 DB02 work.
-- 2. Express these tables/columns in Drizzle schema under Chat 1 ownership.
-- 3. Keep program_term_courses.display_order 1-based and NON-UNIQUE as the active legacy
--    service does. semester_course is unique only by (semester_id, course_id); single-row
--    courseOrder updates may collide. Deterministic reads must tie-break duplicate positions
--    (legacy uses course_order ASC, id ASC). Do not add (program_term_id, display_order) uniqueness.
-- 4. Verify direct SQL cannot create cross-college term/course/period/hall/faculty-association links.
-- 5. Verify ACTIVE/INACTIVE/COMPLETED compatibility transitions (including re-activation from
--    INACTIVE) while preserving vNext PLANNED/ARCHIVED semantics; verify cohort start/end dates
--    remain independently editable and ordered; verify legacy
--    class min/max/description plus compatibility start/end round-trip with min >= 0,
--    max 1..500, min <= max, and ordered dates.
-- 6. Verify every offering has stable program-term identity; CORE course/term mismatches fail
--    while term-bound ELECTIVE offerings remain supported; direct SQL must reject delivery links
--    whose offering and section disagree on cohort/period and event-course links whose delivery
--    belongs to a different section.
-- 7. Verify a broad faculty-course association can exist before delivery, requires an ACTIVE
--    FACULTY membership, rejects cross-college links, deactivates historically and cannot
--    duplicate an active pair; removing FACULTY or suspending/ending the membership must close
--    active associations and active course/section teaching assignments in the same transaction
--    and must not auto-reactivate them later; future SCHEDULED events are unassigned while past
--    schedule attribution remains. Archiving the course must likewise close its active broad
--    association pool. Direct section/course teaching-assignment inserts/updates must require an
--    ACTIVE FACULTY membership in the owning college, with role rows locked against de-role races.
-- 8. Run concurrent promotion with same expected version: exactly one commit must win.
-- 9. Verify backward/jump promotions fail, immutable history matches the winner, direct
--    INSERT/UPDATE/DELETE/TRUNCATE of progression events fails, direct progression-state
--    DELETE/TRUNCATE fails, user deletion only nulls actor references, and a truly empty
--    history-free cohort can hard-delete with its initializer state while any real history or
--    academic child keeps the cohort undeletable.
-- 10. Verify same-resource overlap fails while back-to-back [start,end) sessions succeed;
--     concurrently archiving a hall vs creating a future booking must yield exactly one valid winner.
-- 11. Verify CANCELLED events release the scheduling resource while attendance/history remains.
-- 12. No production data backfill is required: vNext is greenfield.


-- ---------------------------------------------------------------------------
-- 6) Role-aware reactivation of existing academic membership/assignment history
-- ---------------------------------------------------------------------------
-- Closing historical faculty/learner rows remains valid during de-role/end;
-- reopening cannot bypass initial membership/role checks by editing status/ended_at.
CREATE OR REPLACE FUNCTION db02_guard_faculty_assignment_reactivation()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_status membership_status;
BEGIN
  IF OLD.ended_at IS NULL OR NEW.ended_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT status INTO v_status FROM college_memberships
   WHERE id = NEW.membership_id FOR SHARE;
  IF v_status IS DISTINCT FROM 'ACTIVE' THEN
    RAISE EXCEPTION 'Cannot reactivate faculty assignment without ACTIVE membership'
      USING ERRCODE='23514';
  END IF;

  PERFORM 1 FROM membership_roles
   WHERE membership_id = NEW.membership_id AND role = 'FACULTY' FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cannot reactivate faculty assignment without FACULTY role'
      USING ERRCODE='23514';
  END IF;

  IF TG_TABLE_NAME = 'faculty_course_associations' THEN
    PERFORM 1 FROM courses
     WHERE id = NEW.course_id AND status = 'ACTIVE'
     FOR SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cannot reactivate faculty-course association for archived course'
        USING ERRCODE='23514';
    END IF;
  ELSIF TG_TABLE_NAME = 'section_faculty_assignments' THEN
    PERFORM 1 FROM sections
     WHERE id = NEW.section_id AND status = 'ACTIVE'
     FOR SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cannot reactivate faculty assignment for archived section'
        USING ERRCODE='23514';
    END IF;
  ELSIF TG_TABLE_NAME = 'course_teaching_assignments' THEN
    PERFORM 1
      FROM course_section_deliveries csd
      JOIN course_offerings co ON co.id = csd.offering_id
      JOIN courses crs ON crs.id = co.course_id
      JOIN sections s ON s.id = csd.section_id
     WHERE csd.id = NEW.delivery_id
       AND csd.ended_at IS NULL
       AND co.status = 'ACTIVE'
       AND crs.status = 'ACTIVE'
       AND s.status = 'ACTIVE'
     FOR SHARE OF csd, co, crs, s;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cannot reactivate teaching assignment without active delivery chain'
        USING ERRCODE='23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_course_pool_reactivation_role_guard
BEFORE UPDATE OF ended_at ON faculty_course_associations
FOR EACH ROW EXECUTE FUNCTION db02_guard_faculty_assignment_reactivation();
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_section_faculty_reactivation_role_guard
BEFORE UPDATE OF ended_at ON section_faculty_assignments
FOR EACH ROW EXECUTE FUNCTION db02_guard_faculty_assignment_reactivation();
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_teaching_reactivation_role_guard
BEFORE UPDATE OF ended_at ON course_teaching_assignments
FOR EACH ROW EXECUTE FUNCTION db02_guard_faculty_assignment_reactivation();
--> statement-breakpoint


CREATE OR REPLACE FUNCTION db02_guard_learner_program_reactivation()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_status membership_status;
  v_program_status program_status;
  v_cohort_status cohort_status;
BEGIN
  IF NEW.status <> 'ACTIVE' OR OLD.status = 'ACTIVE' THEN
    RETURN NEW;
  END IF;

  SELECT status INTO v_status FROM college_memberships
   WHERE id = NEW.membership_id FOR SHARE;
  IF v_status IS DISTINCT FROM 'ACTIVE' THEN
    RAISE EXCEPTION 'Cannot reactivate learner program without ACTIVE membership'
      USING ERRCODE='23514';
  END IF;

  PERFORM 1 FROM membership_roles
   WHERE membership_id = NEW.membership_id AND role = 'LEARNER' FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cannot reactivate learner program without LEARNER role'
      USING ERRCODE='23514';
  END IF;

  SELECT status INTO v_program_status
    FROM programs WHERE id = NEW.program_id FOR SHARE;
  SELECT status INTO v_cohort_status
    FROM cohorts WHERE id = NEW.cohort_id FOR SHARE;

  IF v_program_status IS DISTINCT FROM 'ACTIVE'
     OR v_cohort_status NOT IN ('PLANNED','ACTIVE') THEN
    RAISE EXCEPTION 'Cannot reactivate learner program under inactive program/cohort'
      USING ERRCODE='23514';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_program_enrollment_reactivation_role_guard
BEFORE UPDATE OF status ON learner_program_enrollments
FOR EACH ROW EXECUTE FUNCTION db02_guard_learner_program_reactivation();
--> statement-breakpoint


CREATE OR REPLACE FUNCTION db02_guard_learner_section_reactivation()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_program_status learner_program_enrollment_status;
  v_membership uuid;
  v_status membership_status;
  v_section_status section_status;
  v_period_status academic_period_status;
BEGIN
  IF NEW.status <> 'ACTIVE' OR OLD.status = 'ACTIVE' THEN
    RETURN NEW;
  END IF;

  SELECT status, membership_id INTO v_program_status, v_membership
    FROM learner_program_enrollments WHERE id = NEW.learner_enrollment_id
    FOR SHARE;
  IF v_program_status IS DISTINCT FROM 'ACTIVE' THEN
    RAISE EXCEPTION 'Cannot reactivate section without ACTIVE learner program'
      USING ERRCODE='23514';
  END IF;

  SELECT status INTO v_status FROM college_memberships
   WHERE id = v_membership FOR SHARE;
  IF v_status IS DISTINCT FROM 'ACTIVE' THEN
    RAISE EXCEPTION 'Cannot reactivate section without ACTIVE college membership'
      USING ERRCODE='23514';
  END IF;

  PERFORM 1 FROM membership_roles
   WHERE membership_id = v_membership AND role = 'LEARNER' FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cannot reactivate section without LEARNER role'
      USING ERRCODE='23514';
  END IF;

  SELECT status INTO v_section_status
    FROM sections WHERE id = NEW.section_id FOR SHARE;
  SELECT status INTO v_period_status
    FROM academic_periods WHERE id = NEW.academic_period_id FOR SHARE;

  IF v_section_status IS DISTINCT FROM 'ACTIVE'
     OR v_period_status = 'CLOSED' THEN
    RAISE EXCEPTION 'Cannot reactivate section enrollment under inactive section/closed period'
      USING ERRCODE='23514';
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_section_enrollment_reactivation_role_guard
BEFORE UPDATE OF status ON section_enrollments
FOR EACH ROW EXECUTE FUNCTION db02_guard_learner_section_reactivation();
--> statement-breakpoint


-- Direct enrollment withdrawal/completion previously left ACTIVE child sections.
CREATE OR REPLACE FUNCTION db02_close_active_sections_on_program_exit()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'ACTIVE' AND NEW.status <> 'ACTIVE' THEN
    UPDATE section_enrollments
       SET status = CASE WHEN NEW.status = 'COMPLETED' THEN 'COMPLETED'::section_enrollment_status
                         ELSE 'WITHDRAWN'::section_enrollment_status END,
           ended_at = COALESCE(ended_at, statement_timestamp()),
           updated_at = statement_timestamp()
     WHERE learner_enrollment_id = NEW.id AND status = 'ACTIVE';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint


CREATE OR REPLACE TRIGGER db02_program_exit_close_active_sections
AFTER UPDATE OF status ON learner_program_enrollments
FOR EACH ROW EXECUTE FUNCTION db02_close_active_sections_on_program_exit();
--> statement-breakpoint

