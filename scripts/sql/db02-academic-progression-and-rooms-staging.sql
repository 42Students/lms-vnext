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

CREATE TABLE program_term_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_term_id uuid NOT NULL REFERENCES program_terms(id) ON DELETE RESTRICT,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  type course_offering_type NOT NULL DEFAULT 'CORE',
  credits numeric(6,2),
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT program_term_courses_credits_ck CHECK (credits IS NULL OR credits >= 0),
  CONSTRAINT program_term_courses_display_order_ck CHECK (display_order >= 0),
  CONSTRAINT program_term_courses_term_course_uq UNIQUE (program_term_id, course_id),
  CONSTRAINT program_term_courses_term_order_uq UNIQUE (program_term_id, display_order)
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
  reason text,
  state_version bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cohort_progression_events_forward_ck CHECK (to_term_number = from_term_number + 1),
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
BEGIN
  SELECT p.duration_terms, d.college_id
    INTO max_terms, cohort_college
    FROM cohorts c
    JOIN programs p ON p.id = c.program_id
    JOIN departments d ON d.id = p.department_id
   WHERE c.id = NEW.cohort_id
   FOR UPDATE OF c;

  IF max_terms IS NULL OR cohort_college IS NULL THEN
    RAISE EXCEPTION 'Unknown cohort/program scope' USING ERRCODE='23503';
  END IF;

  IF NEW.current_term_number > max_terms THEN
    RAISE EXCEPTION 'Cohort term exceeds program duration'
      USING ERRCODE='23514';
  END IF;

  IF NEW.current_period_id IS NOT NULL THEN
    SELECT college_id INTO period_college
      FROM academic_periods
     WHERE id = NEW.current_period_id;
    IF period_college IS NULL THEN
      RAISE EXCEPTION 'Unknown academic period' USING ERRCODE='23503';
    END IF;
    IF period_college <> cohort_college THEN
      RAISE EXCEPTION 'Cohort and academic period must belong to the same college'
        USING ERRCODE='23514';
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.current_term_number <> 1 OR NEW.version <> 0 THEN
      RAISE EXCEPTION 'New cohort progression must start at term 1, version 0'
        USING ERRCODE='23514';
    END IF;
  ELSE
    IF NEW.current_term_number <> OLD.current_term_number + 1 THEN
      RAISE EXCEPTION 'Cohort promotion must advance exactly one term'
        USING ERRCODE='23514';
    END IF;
    IF NEW.version <> OLD.version + 1 THEN
      RAISE EXCEPTION 'Cohort progression version must increment exactly once'
        USING ERRCODE='23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_cohort_progression_state_guard
BEFORE INSERT OR UPDATE ON cohort_progression_state
FOR EACH ROW EXECUTE FUNCTION db02_guard_cohort_progression_state();

-- Every successful state transition must have exactly one matching history row.
-- Services should update progression state and insert the event in one SERIALIZABLE
-- or compare-and-set transaction using the caller's expected version.
CREATE FUNCTION db02_guard_progression_event_matches_state()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  current_state cohort_progression_state%ROWTYPE;
BEGIN
  SELECT * INTO current_state
    FROM cohort_progression_state
   WHERE cohort_id = NEW.cohort_id
   FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cohort progression state does not exist' USING ERRCODE='23503';
  END IF;

  IF NEW.to_term_number <> current_state.current_term_number
     OR NEW.to_academic_year_start IS DISTINCT FROM current_state.current_academic_year_start
     OR NEW.to_period_id IS DISTINCT FROM current_state.current_period_id
     OR NEW.state_version <> current_state.version THEN
    RAISE EXCEPTION 'Progression history must describe the committed cohort state'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_cohort_progression_event_guard
BEFORE INSERT ON cohort_progression_events
FOR EACH ROW EXECUTE FUNCTION db02_guard_progression_event_matches_state();

-- ---------------------------------------------------------------------------
-- 3) Lecture halls as tenant-owned resources
-- ---------------------------------------------------------------------------
CREATE TABLE lecture_halls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  department_id uuid REFERENCES departments(id) ON DELETE RESTRICT,
  name text NOT NULL,
  capacity integer NOT NULL,
  description text,
  room_type varchar(64),
  status varchar(32) NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lecture_halls_name_ck CHECK (btrim(name) <> ''),
  CONSTRAINT lecture_halls_capacity_ck CHECK (capacity >= 0),
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
  hall_college uuid;
BEGIN
  IF NEW.lecture_hall_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT d.college_id INTO section_college
    FROM sections s
    JOIN cohorts c ON c.id=s.cohort_id
    JOIN programs p ON p.id=c.program_id
    JOIN departments d ON d.id=p.department_id
   WHERE s.id=NEW.section_id;

  SELECT college_id INTO hall_college
    FROM lecture_halls
   WHERE id=NEW.lecture_hall_id AND status='ACTIVE';

  IF section_college IS NULL OR hall_college IS NULL THEN
    RAISE EXCEPTION 'Unknown section or inactive lecture hall' USING ERRCODE='23503';
  END IF;
  IF section_college <> hall_college THEN
    RAISE EXCEPTION 'Schedule section and lecture hall must belong to the same college'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_schedule_hall_tenant_guard
BEFORE INSERT OR UPDATE OF section_id, lecture_hall_id ON section_schedule_events
FOR EACH ROW EXECUTE FUNCTION db02_guard_schedule_hall_tenant();

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
-- Registration / acceptance notes
-- ---------------------------------------------------------------------------
-- Before registration:
-- 1. Reconcile against latest main and any Chat 1 DB02 work.
-- 2. Express these tables/columns in Drizzle schema under Chat 1 ownership.
-- 3. Decide whether program_term_courses.display_order must be unique or merely stable;
--    current staging chooses unique deterministic order.
-- 4. Verify direct SQL cannot create cross-college term/course/period/hall links.
-- 5. Run concurrent promotion with same expected version: exactly one commit must win.
-- 6. Verify backward/jump promotions fail and immutable history matches the winner.
-- 7. Verify same-resource overlap fails while back-to-back [start,end) sessions succeed.
-- 8. Verify CANCELLED events release the scheduling resource while attendance/history remains.
-- 9. No production data backfill is required: vNext is greenfield.
