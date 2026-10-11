-- DB02 staging proposal ONLY. Chat 1 owns numbered Drizzle migration registration,
-- shared schema-barrel changes, replay and final integration.
-- Source contract: docs/planning/db02-academic-progression-contract.md
-- This file is intentionally additive and assumes the current 0040 snapshot.

-- ---------------------------------------------------------------------------
-- 1) Program-scoped term identity + ordered curriculum
-- ---------------------------------------------------------------------------
CREATE TABLE program_terms (
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

CREATE INDEX program_terms_program_active_idx
  ON program_terms(program_id, is_active, term_number);

CREATE FUNCTION db02_guard_program_term_bounds()
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

CREATE TRIGGER db02_program_term_bounds_guard
BEFORE INSERT OR UPDATE OF program_id, term_number ON program_terms
FOR EACH ROW EXECUTE FUNCTION db02_guard_program_term_bounds();

CREATE TABLE program_term_courses (
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

CREATE INDEX program_term_courses_course_idx
  ON program_term_courses(course_id, program_term_id);

-- Keep curriculum links within one college. A course from another department/college
-- must never be attached to a program term by direct SQL.
CREATE FUNCTION db02_guard_program_term_course_tenant()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  program_college uuid;
  course_college uuid;
BEGIN
  SELECT d.college_id INTO program_college
    FROM program_terms pt
    JOIN programs p ON p.id = pt.program_id
    JOIN departments d ON d.id = p.department_id
   WHERE pt.id = NEW.program_term_id;

  SELECT d.college_id INTO course_college
    FROM courses c
    JOIN departments d ON d.id = c.department_id
   WHERE c.id = NEW.course_id;

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

CREATE TRIGGER db02_program_term_course_tenant
BEFORE INSERT OR UPDATE OF program_term_id, course_id ON program_term_courses
FOR EACH ROW EXECUTE FUNCTION db02_guard_program_term_course_tenant();

-- Semester-course parent identity is immutable in the active legacy service: only
-- mandatory/type, credits and display order are editable. Keep the normalized pair stable.
CREATE FUNCTION db02_guard_program_term_course_identity()
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

CREATE TRIGGER db02_program_term_course_identity_guard
BEFORE UPDATE OF program_term_id, course_id ON program_term_courses
FOR EACH ROW EXECUTE FUNCTION db02_guard_program_term_course_identity();

-- A curriculum row may be removed while unused, matching legacy semester-course removal.
-- Once any offering materializes the term/course pair, deletion would rewrite historical
-- curriculum identity and is therefore rejected.
CREATE FUNCTION db02_guard_program_term_course_delete()
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

CREATE TRIGGER db02_program_term_course_delete_guard
BEFORE DELETE ON program_term_courses
FOR EACH ROW EXECUTE FUNCTION db02_guard_program_term_course_delete();

-- Legacy semester-course credits are valid from 0..30. A zero-credit curriculum row
-- must remain materializable as a cohort offering instead of failing a stricter vNext check.
ALTER TABLE course_offerings
  DROP CONSTRAINT IF EXISTS course_offerings_credits_ck;

ALTER TABLE course_offerings
  ADD CONSTRAINT db02_course_offerings_credits_ck
  CHECK (credits IS NULL OR credits BETWEEN 0 AND 30);

-- ---------------------------------------------------------------------------
-- 1a) Stable tenant ownership + academic-period scope
-- ---------------------------------------------------------------------------
-- Department ownership is immutable in product APIs. Programs may move departments only
-- within one college; courses do not expose department reassignment. Protect those facts
-- at the DB boundary because every downstream academic tenant scope derives through them.
CREATE FUNCTION db02_guard_department_college_immutability()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.college_id <> OLD.college_id THEN
    RAISE EXCEPTION 'Department cannot move to another college'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_department_college_immutable
BEFORE UPDATE OF college_id ON departments
FOR EACH ROW EXECUTE FUNCTION db02_guard_department_college_immutability();

CREATE FUNCTION db02_guard_program_department_move()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  old_college uuid;
  new_college uuid;
BEGIN
  IF NEW.department_id = OLD.department_id THEN
    RETURN NEW;
  END IF;

  SELECT college_id INTO old_college FROM departments WHERE id = OLD.department_id;
  SELECT college_id INTO new_college FROM departments WHERE id = NEW.department_id;

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

CREATE TRIGGER db02_program_department_move_guard
BEFORE UPDATE OF department_id ON programs
FOR EACH ROW EXECUTE FUNCTION db02_guard_program_department_move();

CREATE FUNCTION db02_guard_course_department_move()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  old_college uuid;
  new_college uuid;
BEGIN
  IF NEW.department_id = OLD.department_id THEN
    RETURN NEW;
  END IF;

  SELECT college_id INTO old_college FROM departments WHERE id = OLD.department_id;
  SELECT college_id INTO new_college FROM departments WHERE id = NEW.department_id;

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

CREATE TRIGGER db02_course_department_move_guard
BEFORE UPDATE OF department_id ON courses
FOR EACH ROW EXECUTE FUNCTION db02_guard_course_department_move();

CREATE FUNCTION db02_guard_cohort_period_scope()
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
   WHERE p.id = NEW.program_id;

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
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_cohort_period_scope_guard
BEFORE INSERT OR UPDATE OF program_id, start_period_id, expected_end_period_id
ON cohorts
FOR EACH ROW EXECUTE FUNCTION db02_guard_cohort_period_scope();

CREATE FUNCTION db02_guard_section_period_scope()
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
   WHERE c.id = NEW.cohort_id;

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

CREATE TRIGGER db02_section_period_scope_guard
BEFORE INSERT OR UPDATE OF cohort_id, academic_period_id
ON sections
FOR EACH ROW EXECUTE FUNCTION db02_guard_section_period_scope();

-- ---------------------------------------------------------------------------
-- 1b) Stable program-term identity on course offerings
-- ---------------------------------------------------------------------------
-- academic_period_id is calendar identity. program_term_id is the stable program-specific
-- curriculum term identity required by promotion, teaching history and elective eligibility.
ALTER TABLE course_offerings
  ADD COLUMN program_term_id uuid NOT NULL
  REFERENCES program_terms(id) ON DELETE RESTRICT;

CREATE INDEX course_offerings_program_term_idx
  ON course_offerings(program_term_id, status);

CREATE FUNCTION db02_guard_course_offering_program_term_scope()
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

  -- CORE delivery must be backed by canonical curriculum. Lock the exact curriculum row
  -- so a concurrent semester-course removal cannot commit after this validation.
  -- ELECTIVE delivery is term-bound but may sit outside the fixed curriculum list.
  IF NEW.type = 'CORE' THEN
    PERFORM 1
      FROM program_term_courses ptc
     WHERE ptc.program_term_id = NEW.program_term_id
       AND ptc.course_id = NEW.course_id
     FOR SHARE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Core course offering must belong to the selected program-term curriculum'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_course_offering_program_term_guard
BEFORE INSERT OR UPDATE OF course_id, cohort_id, academic_period_id, type, program_term_id
ON course_offerings
FOR EACH ROW EXECUTE FUNCTION db02_guard_course_offering_program_term_scope();

CREATE FUNCTION db02_guard_course_offering_period_window()
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
   WHERE c.id = NEW.cohort_id;

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

CREATE TRIGGER db02_course_offering_period_window_guard
BEFORE INSERT OR UPDATE OF cohort_id, academic_period_id
ON course_offerings
FOR EACH ROW EXECUTE FUNCTION db02_guard_course_offering_period_window();

-- ---------------------------------------------------------------------------
-- 1c) Cohort/class CRUD state that is not equivalent to college-wide periods
-- ---------------------------------------------------------------------------
-- Legacy batch status is ACTIVE | INACTIVE | COMPLETED and INACTIVE is editable/reversible.
-- ARCHIVED is a separate vNext terminal/storage concern and cannot substitute for INACTIVE.
ALTER TYPE cohort_status ADD VALUE IF NOT EXISTS 'INACTIVE';


-- Legacy batch dates are optional, independently editable lifecycle metadata. Period FKs
-- remain the scheduling/calendar anchors, but cannot reproduce arbitrary batch-specific dates.
ALTER TABLE cohorts
  ADD COLUMN start_date date,
  ADD COLUMN end_date date;

ALTER TABLE cohorts
  ADD CONSTRAINT cohorts_lifecycle_date_order_ck
  CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date);

-- Legacy class description and lower_limit are live admin CRUD fields. sections.capacity is the
-- upper limit. Keep vNext capacity nullable for non-legacy creation flows, while compatibility
-- producers must provide it and obey the legacy 1..500 bound.
ALTER TABLE sections
  ADD COLUMN description text,
  ADD COLUMN minimum_capacity integer NOT NULL DEFAULT 0,
  ADD COLUMN start_date date,
  ADD COLUMN end_date date;

ALTER TABLE sections
  DROP CONSTRAINT IF EXISTS sections_capacity_ck;

ALTER TABLE sections
  ADD CONSTRAINT sections_capacity_ck
    CHECK (capacity IS NULL OR capacity BETWEEN 1 AND 500),
  ADD CONSTRAINT sections_minimum_capacity_ck
    CHECK (minimum_capacity >= 0),
  ADD CONSTRAINT sections_capacity_range_ck
    CHECK (capacity IS NULL OR minimum_capacity <= capacity),
  ADD CONSTRAINT sections_lifecycle_date_order_ck
    CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date);

-- ---------------------------------------------------------------------------
-- 1d) Delivery/event chain scope integrity
-- ---------------------------------------------------------------------------
-- Teaching assignments and schedules inherit cohort/period/term identity through delivery.
-- Protect that chain at the database boundary instead of relying only on service validation.
CREATE FUNCTION db02_guard_course_section_delivery_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  offering_cohort uuid;
  offering_period uuid;
  section_cohort uuid;
  section_period uuid;
BEGIN
  SELECT co.cohort_id, co.academic_period_id
    INTO offering_cohort, offering_period
    FROM course_offerings co
   WHERE co.id = NEW.offering_id
   FOR SHARE OF co;

  SELECT s.cohort_id, s.academic_period_id
    INTO section_cohort, section_period
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

  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_course_section_delivery_scope_guard
BEFORE INSERT OR UPDATE OF offering_id, section_id
ON course_section_deliveries
FOR EACH ROW EXECUTE FUNCTION db02_guard_course_section_delivery_scope();

CREATE FUNCTION db02_guard_schedule_event_delivery_scope()
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

CREATE TRIGGER db02_schedule_event_delivery_scope_guard
BEFORE INSERT OR UPDATE OF schedule_event_id, delivery_id
ON section_schedule_event_courses
FOR EACH ROW EXECUTE FUNCTION db02_guard_schedule_event_delivery_scope();

-- ---------------------------------------------------------------------------
-- 2) Canonical cohort progression state + immutable history
-- ---------------------------------------------------------------------------
CREATE TABLE cohort_progression_state (
  cohort_id uuid PRIMARY KEY REFERENCES cohorts(id) ON DELETE RESTRICT,
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

CREATE TABLE cohort_progression_events (
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

CREATE INDEX cohort_progression_events_cohort_time_idx
  ON cohort_progression_events(cohort_id, created_at DESC);

CREATE FUNCTION db02_guard_cohort_progression_state()
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

CREATE TRIGGER db02_cohort_progression_state_guard
BEFORE INSERT OR UPDATE OF current_term_number, current_academic_year_start, current_period_id, version, updated_by_user_id
ON cohort_progression_state
FOR EACH ROW EXECUTE FUNCTION db02_guard_cohort_progression_state();

-- Database-owned history: a direct SQL update cannot advance canonical state without
-- producing a matching immutable event. Application code must NOT insert a duplicate event.
CREATE FUNCTION db02_record_cohort_progression_event()
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

CREATE TRIGGER db02_cohort_progression_history
AFTER UPDATE OF current_term_number, current_academic_year_start, current_period_id, version
ON cohort_progression_state
FOR EACH ROW EXECUTE FUNCTION db02_record_cohort_progression_event();

-- State updates still need a compare-and-set predicate (cohort_id + expected version)
-- in the service transaction. The DB trigger guarantees monotonicity/version/history;
-- the update predicate decides the single concurrent winner.

-- An explicit event is only valid when written by the cohort-state AFTER UPDATE
-- trigger. Application accounts must not forge, mutate or delete the audit trail.
-- This is a staging defense, not a substitute for restricting schema/DDL privileges.
CREATE FUNCTION db02_guard_progression_event_immutability()
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

CREATE TRIGGER db02_cohort_progression_events_immutable
BEFORE INSERT OR UPDATE OR DELETE ON cohort_progression_events
FOR EACH ROW EXECUTE FUNCTION db02_guard_progression_event_immutability();

CREATE TRIGGER db02_cohort_progression_events_no_truncate
BEFORE TRUNCATE ON cohort_progression_events
FOR EACH STATEMENT EXECUTE FUNCTION db02_guard_progression_event_immutability();

-- Ensure every newly created cohort has exactly one canonical term/year row.
-- The initial July-boundary year is only a default; an explicit user-supplied
-- legacy year override still needs a reviewed cohort creation API contract.
CREATE FUNCTION db02_initialize_cohort_progression_state()
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

CREATE TRIGGER db02_cohort_progression_initialize
AFTER INSERT ON cohorts
FOR EACH ROW EXECUTE FUNCTION db02_initialize_cohort_progression_state();

-- A program cannot shrink below an existing term or promoted cohort.
-- Program term inserts and cohort promotion also lock the program row FOR SHARE,
-- serializing concurrent duration reduction with active academic writes.
CREATE FUNCTION db02_guard_program_duration_reduction()
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

CREATE TRIGGER db02_program_duration_reduction_guard
BEFORE UPDATE OF duration_terms ON programs
FOR EACH ROW EXECUTE FUNCTION db02_guard_program_duration_reduction();

-- ---------------------------------------------------------------------------
-- 3) Lecture halls as tenant-owned resources
-- ---------------------------------------------------------------------------
CREATE TABLE lecture_halls (
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

CREATE UNIQUE INDEX lecture_halls_active_college_name_uq
  ON lecture_halls(college_id, lower(name))
  WHERE status = 'ACTIVE';

CREATE INDEX lecture_halls_department_idx
  ON lecture_halls(department_id, status);

CREATE FUNCTION db02_guard_lecture_hall_department()
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

CREATE TRIGGER db02_lecture_hall_department_guard
BEFORE INSERT OR UPDATE OF college_id, department_id ON lecture_halls
FOR EACH ROW EXECUTE FUNCTION db02_guard_lecture_hall_department();

ALTER TABLE section_schedule_events
  ADD COLUMN lecture_hall_id uuid REFERENCES lecture_halls(id) ON DELETE RESTRICT;

CREATE INDEX section_schedule_events_hall_time_idx
  ON section_schedule_events(lecture_hall_id, starts_at, ends_at)
  WHERE lecture_hall_id IS NOT NULL AND status = 'SCHEDULED';

CREATE FUNCTION db02_guard_schedule_hall_tenant()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  section_college uuid;
  faculty_college uuid;
  hall_college uuid;
BEGIN
  -- Validate section and faculty even if there is no assigned lecture hall.
  -- The earlier early-return allowed direct SQL to attach a cross-college
  -- faculty_membership_id whenever lecture_hall_id was NULL.
  SELECT d.college_id INTO section_college
    FROM sections s
    JOIN cohorts c ON c.id = s.cohort_id
    JOIN programs p ON p.id = c.program_id
    JOIN departments d ON d.id = p.department_id
   WHERE s.id = NEW.section_id;

  IF section_college IS NULL THEN
    RAISE EXCEPTION 'Unknown schedule section scope' USING ERRCODE = '23503';
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
    -- Existing cancelled sessions may retain an archived hall reference.
    -- New active bookings may only use currently ACTIVE lecture halls.
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

CREATE TRIGGER db02_schedule_hall_tenant_guard
BEFORE INSERT OR UPDATE OF section_id, faculty_membership_id, lecture_hall_id, status
ON section_schedule_events
FOR EACH ROW EXECUTE FUNCTION db02_guard_schedule_hall_tenant();

-- Serialize hall archival with booking creation. The schedule trigger takes FOR SHARE on the
-- hall; an archive UPDATE takes the conflicting row lock. Whichever wins first determines the
-- valid result without allowing an ACTIVE future booking to reference an archived hall.
CREATE FUNCTION db02_guard_lecture_hall_archive()
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

CREATE TRIGGER db02_lecture_hall_archive_guard
BEFORE UPDATE OF status ON lecture_halls
FOR EACH ROW EXECUTE FUNCTION db02_guard_lecture_hall_archive();

-- PostgreSQL overlap invariants. Chat 1 must confirm btree_gist is available in the
-- target Cloud SQL/PostgreSQL environment before registering this section.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE section_schedule_events
  ADD CONSTRAINT section_schedule_events_section_no_overlap_excl
  EXCLUDE USING gist (
    section_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  ) WHERE (status = 'SCHEDULED');

ALTER TABLE section_schedule_events
  ADD CONSTRAINT section_schedule_events_faculty_no_overlap_excl
  EXCLUDE USING gist (
    faculty_membership_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  ) WHERE (status = 'SCHEDULED' AND faculty_membership_id IS NOT NULL);

ALTER TABLE section_schedule_events
  ADD CONSTRAINT section_schedule_events_hall_no_overlap_excl
  EXCLUDE USING gist (
    lecture_hall_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  ) WHERE (status = 'SCHEDULED' AND lecture_hall_id IS NOT NULL);

-- ---------------------------------------------------------------------------
-- 3a) Section faculty assignment tenant/role integrity
-- ---------------------------------------------------------------------------
CREATE FUNCTION db02_guard_section_faculty_assignment_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  section_college uuid;
  membership_college uuid;
BEGIN
  SELECT d.college_id
    INTO section_college
    FROM sections s
    JOIN cohorts c ON c.id = s.cohort_id
    JOIN programs p ON p.id = c.program_id
    JOIN departments d ON d.id = p.department_id
   WHERE s.id = NEW.section_id;

  SELECT cm.college_id
    INTO membership_college
    FROM college_memberships cm
   WHERE cm.id = NEW.membership_id
     AND cm.status = 'ACTIVE'
   FOR SHARE;

  IF section_college IS NULL OR membership_college IS NULL THEN
    RAISE EXCEPTION 'Unknown section or inactive faculty membership'
      USING ERRCODE = '23503';
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

  IF section_college <> membership_college THEN
    RAISE EXCEPTION 'Section faculty assignment must stay within one college'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_section_faculty_assignment_scope_guard
BEFORE INSERT OR UPDATE OF section_id, membership_id
ON section_faculty_assignments
FOR EACH ROW EXECUTE FUNCTION db02_guard_section_faculty_assignment_scope();

-- ---------------------------------------------------------------------------
-- 3b) Course teaching assignment tenant/role integrity
-- ---------------------------------------------------------------------------
CREATE FUNCTION db02_guard_course_teaching_assignment_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  delivery_college uuid;
  membership_college uuid;
BEGIN
  SELECT d.college_id
    INTO delivery_college
    FROM course_section_deliveries csd
    JOIN course_offerings co ON co.id = csd.offering_id
    JOIN cohorts c ON c.id = co.cohort_id
    JOIN programs p ON p.id = c.program_id
    JOIN departments d ON d.id = p.department_id
   WHERE csd.id = NEW.delivery_id
   FOR SHARE OF csd;

  SELECT cm.college_id
    INTO membership_college
    FROM college_memberships cm
   WHERE cm.id = NEW.membership_id
     AND cm.status = 'ACTIVE'
   FOR SHARE;

  IF delivery_college IS NULL OR membership_college IS NULL THEN
    RAISE EXCEPTION 'Unknown delivery or inactive faculty membership'
      USING ERRCODE = '23503';
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

  IF delivery_college <> membership_college THEN
    RAISE EXCEPTION 'Course teaching assignment must stay within one college'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_course_teaching_assignment_scope_guard
BEFORE INSERT OR UPDATE OF delivery_id, membership_id
ON course_teaching_assignments
FOR EACH ROW EXECUTE FUNCTION db02_guard_course_teaching_assignment_scope();

-- ---------------------------------------------------------------------------
-- 4) Broad faculty-course association pool
-- ---------------------------------------------------------------------------
-- Distinct from course_teaching_assignments: legacy admins can associate faculty with a
-- course before a class/delivery assignment exists, and course-scoped flows query this pool.
CREATE TABLE faculty_course_associations (
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

CREATE UNIQUE INDEX faculty_course_associations_active_uq
  ON faculty_course_associations(membership_id, course_id)
  WHERE ended_at IS NULL;

CREATE INDEX faculty_course_associations_course_active_idx
  ON faculty_course_associations(course_id, membership_id)
  WHERE ended_at IS NULL;

CREATE FUNCTION db02_guard_faculty_course_association_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  membership_college uuid;
  course_college uuid;
BEGIN
  SELECT cm.college_id
    INTO membership_college
    FROM college_memberships cm
   WHERE cm.id = NEW.membership_id
     AND cm.status = 'ACTIVE'
   FOR SHARE;

  IF membership_college IS NULL THEN
    RAISE EXCEPTION 'Unknown or inactive faculty membership'
      USING ERRCODE = '23503';
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

  SELECT d.college_id
    INTO course_college
    FROM courses c
    JOIN departments d ON d.id = c.department_id
   WHERE c.id = NEW.course_id;

  IF course_college IS NULL THEN
    RAISE EXCEPTION 'Unknown course'
      USING ERRCODE = '23503';
  END IF;

  IF membership_college <> course_college THEN
    RAISE EXCEPTION 'Faculty-course association must stay within one college'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_faculty_course_association_scope_guard
BEFORE INSERT OR UPDATE OF membership_id, course_id
ON faculty_course_associations
FOR EACH ROW EXECUTE FUNCTION db02_guard_faculty_course_association_scope();

-- Keep association lifecycle valid when identity state changes after association creation.
-- The insert/update guard alone is insufficient: admins can later remove FACULTY or suspend/end
-- the membership. These AFTER triggers close active associations in the same transaction.
CREATE FUNCTION db02_end_faculty_course_associations_on_role_removal()
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

CREATE TRIGGER db02_faculty_course_associations_role_removal
AFTER DELETE ON membership_roles
FOR EACH ROW EXECUTE FUNCTION db02_end_faculty_course_associations_on_role_removal();

CREATE FUNCTION db02_end_faculty_course_associations_on_membership_inactive()
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

CREATE TRIGGER db02_faculty_course_associations_membership_inactive
AFTER UPDATE OF status ON college_memberships
FOR EACH ROW EXECUTE FUNCTION db02_end_faculty_course_associations_on_membership_inactive();

CREATE FUNCTION db02_end_faculty_course_associations_on_course_archive()
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

CREATE TRIGGER db02_faculty_course_associations_course_archive
AFTER UPDATE OF status ON courses
FOR EACH ROW EXECUTE FUNCTION db02_end_faculty_course_associations_on_course_archive();

-- ---------------------------------------------------------------------------
-- 5) Remaining parent/enrollment/history integrity
-- ---------------------------------------------------------------------------
-- ---------------------------------------------------------------------------
-- 5a) Remaining tenant-owner roots are immutable
-- ---------------------------------------------------------------------------
CREATE FUNCTION db02_guard_remaining_college_owner_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.college_id IS DISTINCT FROM OLD.college_id THEN
    RAISE EXCEPTION 'DB02 tenant owner college cannot change in place'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_academic_period_college_immutable
BEFORE UPDATE OF college_id ON academic_periods
FOR EACH ROW EXECUTE FUNCTION db02_guard_remaining_college_owner_immutable();

-- Period dates may be edited while a PLANNED period is unused. Once academic state points
-- at the period, changing its boundaries would reinterpret cohort/section/offering history.
-- Child writers lock the period row before validation so this rule is race-safe.
CREATE FUNCTION db02_guard_academic_period_date_history()
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

CREATE TRIGGER db02_academic_period_date_history_guard
BEFORE UPDATE OF start_date, end_date ON academic_periods
FOR EACH ROW EXECUTE FUNCTION db02_guard_academic_period_date_history();

CREATE TRIGGER db02_membership_college_immutable
BEFORE UPDATE OF college_id ON college_memberships
FOR EACH ROW EXECUTE FUNCTION db02_guard_remaining_college_owner_immutable();

CREATE TRIGGER db02_lecture_hall_college_immutable
BEFORE UPDATE OF college_id ON lecture_halls
FOR EACH ROW EXECUTE FUNCTION db02_guard_remaining_college_owner_immutable();

-- ---------------------------------------------------------------------------
-- 5b) Academic parent identity cannot be silently rewritten
-- ---------------------------------------------------------------------------
-- Legacy BatchService rejects moving an existing batch/cohort to another program.
-- vNext also treats the start period as creation identity. A controlled transfer must
-- create explicit history instead of rewriting the parent keys in place.
CREATE FUNCTION db02_guard_cohort_parent_immutable()
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

CREATE TRIGGER db02_cohort_program_immutable
BEFORE UPDATE OF program_id, start_period_id ON cohorts
FOR EACH ROW EXECUTE FUNCTION db02_guard_cohort_parent_immutable();

CREATE FUNCTION db02_guard_program_term_identity_immutable()
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

CREATE TRIGGER db02_program_term_identity_immutable
BEFORE UPDATE OF program_id, term_number ON program_terms
FOR EACH ROW EXECUTE FUNCTION db02_guard_program_term_identity_immutable();

-- Empty sections may still be reparented within the canonical same-college/window rules.
-- Once any learner/faculty/delivery/schedule history exists, structural movement requires an
-- explicit controlled-transfer workflow so prior history is not silently reinterpreted.
CREATE FUNCTION db02_guard_section_history_reparent()
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

CREATE TRIGGER db02_section_history_reparent_guard
BEFORE UPDATE OF cohort_id, academic_period_id ON sections
FOR EACH ROW EXECUTE FUNCTION db02_guard_section_history_reparent();

-- ---------------------------------------------------------------------------
-- 5c) Learner program/section enrollment scope
-- ---------------------------------------------------------------------------
CREATE FUNCTION db02_guard_learner_program_enrollment_tenant()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  membership_college uuid;
  program_college uuid;
  cohort_program uuid;
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

  SELECT d.college_id
    INTO program_college
    FROM programs p
    JOIN departments d ON d.id = p.department_id
   WHERE p.id = NEW.program_id;

  SELECT program_id
    INTO cohort_program
    FROM cohorts
   WHERE id = NEW.cohort_id;

  IF program_college IS NULL
     OR cohort_program IS NULL
     OR membership_college <> program_college
     OR cohort_program <> NEW.program_id THEN
    RAISE EXCEPTION 'DB02 learner enrollment membership/program/cohort scope mismatch'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_learner_program_enrollment_tenant
BEFORE INSERT OR UPDATE OF membership_id, program_id, cohort_id
ON learner_program_enrollments
FOR EACH ROW EXECUTE FUNCTION db02_guard_learner_program_enrollment_tenant();

CREATE FUNCTION db02_guard_section_enrollment_cohort_period()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  learner_cohort uuid;
  target_cohort uuid;
  target_period uuid;
BEGIN
  SELECT cohort_id
    INTO learner_cohort
    FROM learner_program_enrollments
   WHERE id = NEW.learner_enrollment_id;

  SELECT cohort_id, academic_period_id
    INTO target_cohort, target_period
    FROM sections
   WHERE id = NEW.section_id;

  IF learner_cohort IS NULL
     OR target_cohort IS NULL
     OR target_period IS NULL
     OR learner_cohort <> target_cohort
     OR NEW.academic_period_id <> target_period THEN
    RAISE EXCEPTION 'DB02 learner section cohort/period scope mismatch'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_section_enrollment_cohort_period
BEFORE INSERT OR UPDATE OF learner_enrollment_id, section_id, academic_period_id
ON section_enrollments
FOR EACH ROW EXECUTE FUNCTION db02_guard_section_enrollment_cohort_period();

-- ---------------------------------------------------------------------------
-- 5d) Learner identity lifecycle closes active academic state
-- ---------------------------------------------------------------------------
-- Temporary membership suspension is an access-control state, not academic withdrawal.
-- Legacy batch usage still counts suspended, non-deleted learners attached to primary classes.
-- Removing LEARNER or ending the college membership is different: active section/program
-- enrollment must become historical and must not keep contributing to current cohort counts.
CREATE FUNCTION db02_withdraw_learner_on_role_delete()
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

CREATE TRIGGER db02_withdraw_learner_on_role_removal
AFTER DELETE ON membership_roles
FOR EACH ROW EXECUTE FUNCTION db02_withdraw_learner_on_role_delete();

CREATE FUNCTION db02_withdraw_learner_on_membership_end()
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

CREATE TRIGGER db02_withdraw_learner_on_membership_end
AFTER UPDATE OF status ON college_memberships
FOR EACH ROW EXECUTE FUNCTION db02_withdraw_learner_on_membership_end();

-- ---------------------------------------------------------------------------
-- 5e) Serialize history creation against section structural movement
-- ---------------------------------------------------------------------------
-- PostgreSQL FK inserts normally take KEY SHARE, compatible with NO KEY UPDATE.
-- Promote history-producing references to SHARE so they serialize with section reparenting
-- before the history guard decides whether a move remains legal.
CREATE FUNCTION db02_lock_section_history_parent()
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

CREATE TRIGGER db02_lock_section_for_learner_enrollment
BEFORE INSERT OR UPDATE OF section_id ON section_enrollments
FOR EACH ROW EXECUTE FUNCTION db02_lock_section_history_parent();

CREATE TRIGGER db02_lock_section_for_faculty_assignment
BEFORE INSERT OR UPDATE OF section_id ON section_faculty_assignments
FOR EACH ROW EXECUTE FUNCTION db02_lock_section_history_parent();

CREATE TRIGGER db02_lock_section_for_course_delivery
BEFORE INSERT OR UPDATE OF section_id ON course_section_deliveries
FOR EACH ROW EXECUTE FUNCTION db02_lock_section_history_parent();

CREATE TRIGGER db02_lock_section_for_schedule_event
BEFORE INSERT OR UPDATE OF section_id ON section_schedule_events
FOR EACH ROW EXECUTE FUNCTION db02_lock_section_history_parent();

-- ---------------------------------------------------------------------------
-- 5f) Enrollment identity is historical, not mutable parentage
-- ---------------------------------------------------------------------------
CREATE FUNCTION db02_guard_learner_program_enrollment_identity_immutable()
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

CREATE TRIGGER db02_academic_enrollment_identity_immutable
BEFORE UPDATE OF membership_id, program_id, cohort_id
ON learner_program_enrollments
FOR EACH ROW EXECUTE FUNCTION db02_guard_learner_program_enrollment_identity_immutable();

CREATE FUNCTION db02_guard_section_enrollment_identity_immutable()
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

CREATE TRIGGER db02_section_enrollment_identity_immutable
BEFORE UPDATE OF learner_enrollment_id, section_id, academic_period_id
ON section_enrollments
FOR EACH ROW EXECUTE FUNCTION db02_guard_section_enrollment_identity_immutable();


-- ---------------------------------------------------------------------------
-- 6) Final progression/schedule lifecycle integrity
-- ---------------------------------------------------------------------------
-- 6a) Canonical progression-state identity/lifecycle: the initializer creates one row per cohort.
-- A direct cohort_id change would attach progress to the wrong cohort while leaving
-- immutable event history on the old identity; DELETE/TRUNCATE would silently lose it.
CREATE FUNCTION db02_guard_progression_state_identity()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' OR TG_OP = 'TRUNCATE' THEN
    RAISE EXCEPTION 'Canonical cohort progression state is not deletable'
      USING ERRCODE='23514';
  END IF;
  IF NEW.cohort_id IS DISTINCT FROM OLD.cohort_id THEN
    RAISE EXCEPTION 'Canonical cohort progression cannot switch cohort identity'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_progression_state_identity_guard
BEFORE UPDATE OF cohort_id OR DELETE ON cohort_progression_state
FOR EACH ROW EXECUTE FUNCTION db02_guard_progression_state_identity();

CREATE TRIGGER db02_progression_state_no_truncate
BEFORE TRUNCATE ON cohort_progression_state
FOR EACH STATEMENT EXECUTE FUNCTION db02_guard_progression_state_identity();

-- 6b) Prevent timestamp-only UPDATEs from resurrecting historical scheduled
-- events into future bookings on an ARCHIVED hall. The canonical tenant/hall
-- guard runs on section/actor/hall/status changes, not bare starts_at/ends_at.
-- FOR SHARE on the hall row serializes against an archive UPDATE.
CREATE FUNCTION db02_guard_future_schedule_room_lifecycle()
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

CREATE TRIGGER db02_schedule_future_hall_lifecycle_guard
BEFORE INSERT OR UPDATE OF starts_at, ends_at, status, lecture_hall_id
ON section_schedule_events
FOR EACH ROW EXECUTE FUNCTION db02_guard_future_schedule_room_lifecycle();


-- ---------------------------------------------------------------------------
-- 7) Historic parent identity and serialization
-- ---------------------------------------------------------------------------
-- Once dependent academic/attendance history exists, parent identity cannot be silently
-- rewritten. SHARE locks serialize history creation against otherwise-valid parent moves.
CREATE FUNCTION db02_guard_historic_offering_parent()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.cohort_id, NEW.academic_period_id, NEW.course_id, NEW.program_term_id)
     IS DISTINCT FROM
     (OLD.cohort_id, OLD.academic_period_id, OLD.course_id, OLD.program_term_id)
     AND EXISTS (
       SELECT 1 FROM course_section_deliveries d WHERE d.offering_id = OLD.id
     ) THEN
    RAISE EXCEPTION 'Offering academic identity cannot change after delivery exists'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_historic_offering_parent_guard
BEFORE UPDATE OF cohort_id, academic_period_id, course_id, program_term_id
ON course_offerings
FOR EACH ROW EXECUTE FUNCTION db02_guard_historic_offering_parent();

CREATE FUNCTION db02_guard_historic_delivery_parent()
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

CREATE TRIGGER db02_historic_delivery_parent_guard
BEFORE UPDATE OF offering_id, section_id
ON course_section_deliveries
FOR EACH ROW EXECUTE FUNCTION db02_guard_historic_delivery_parent();

CREATE FUNCTION db02_guard_historic_event_section()
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

CREATE TRIGGER db02_historic_event_section_guard
BEFORE UPDATE OF section_id ON section_schedule_events
FOR EACH ROW EXECUTE FUNCTION db02_guard_historic_event_section();

-- FK KEY SHARE row locks do not conflict with a non-key parent UPDATE,
-- which uses NO KEY UPDATE. Explicit SHARE locks serialize parent reparenting
-- against history insertion. The parent guard then sees committed children
-- or the child's validation runs against the committed parent.
CREATE FUNCTION db02_lock_offering_for_delivery()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM 1 FROM course_offerings WHERE id = NEW.offering_id FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown historic course offering' USING ERRCODE='23503';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_delivery_parent_serialization
BEFORE INSERT OR UPDATE OF offering_id ON course_section_deliveries
FOR EACH ROW EXECUTE FUNCTION db02_lock_offering_for_delivery();

CREATE FUNCTION db02_lock_delivery_for_teaching()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM 1 FROM course_section_deliveries WHERE id = NEW.delivery_id FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown delivery for teaching history' USING ERRCODE='23503';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_teaching_delivery_serialization
BEFORE INSERT OR UPDATE OF delivery_id ON course_teaching_assignments
FOR EACH ROW EXECUTE FUNCTION db02_lock_delivery_for_teaching();

CREATE FUNCTION db02_lock_event_delivery_for_course_link()
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

CREATE TRIGGER db02_event_course_parent_serialization
BEFORE INSERT OR UPDATE OF schedule_event_id, delivery_id ON section_schedule_event_courses
FOR EACH ROW EXECUTE FUNCTION db02_lock_event_delivery_for_course_link();

CREATE FUNCTION db02_lock_event_for_attendance_history()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM 1 FROM section_schedule_events WHERE id = NEW.schedule_event_id FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown schedule event for attendance history' USING ERRCODE='23503';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_attendance_session_event_serialization
BEFORE INSERT OR UPDATE OF schedule_event_id ON attendance_sessions
FOR EACH ROW EXECUTE FUNCTION db02_lock_event_for_attendance_history();

CREATE TRIGGER db02_attendance_record_event_serialization
BEFORE INSERT OR UPDATE OF schedule_event_id ON attendance_records
FOR EACH ROW EXECUTE FUNCTION db02_lock_event_for_attendance_history();


-- ---------------------------------------------------------------------------
-- Registration / acceptance notes
-- ---------------------------------------------------------------------------
-- Before registration:
-- 1. Reconcile against latest main and any Chat 1 DB02 work.
-- 2. Express these tables/columns in Drizzle schema under Chat 1 ownership.
-- 3. Keep program_term_courses.display_order 1-based as the active legacy service does; do not add
--    a uniqueness constraint until reorder concurrency has executed acceptance evidence.
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
--    INSERT/UPDATE/DELETE/TRUNCATE of progression events fails, and user deletion only nulls
--    both state/event actor references without changing version/term or creating a fake event.
-- 10. Verify same-resource overlap fails while back-to-back [start,end) sessions succeed;
--     concurrently archiving a hall vs creating a future booking must yield exactly one valid winner.
-- 11. Verify CANCELLED events release the scheduling resource while attendance/history remains.
-- 12. No production data backfill is required: vNext is greenfield.
