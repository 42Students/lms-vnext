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

  -- CORE delivery must be backed by canonical curriculum. ELECTIVE delivery is still
  -- term-bound, but legacy electives can select a course outside the fixed semester-course list.
  IF NEW.type = 'CORE' AND NOT EXISTS (
    SELECT 1
      FROM program_term_courses ptc
     WHERE ptc.program_term_id = NEW.program_term_id
       AND ptc.course_id = NEW.course_id
  ) THEN
    RAISE EXCEPTION 'Core course offering must belong to the selected program-term curriculum'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_course_offering_program_term_guard
BEFORE INSERT OR UPDATE OF course_id, cohort_id, academic_period_id, type, program_term_id
ON course_offerings
FOR EACH ROW EXECUTE FUNCTION db02_guard_course_offering_program_term_scope();

-- ---------------------------------------------------------------------------
-- 1c) Cohort/class CRUD state that is not equivalent to college-wide periods
-- ---------------------------------------------------------------------------
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
  ADD COLUMN minimum_capacity integer NOT NULL DEFAULT 0;

ALTER TABLE sections
  DROP CONSTRAINT IF EXISTS sections_capacity_ck;

ALTER TABLE sections
  ADD CONSTRAINT sections_capacity_ck
    CHECK (capacity IS NULL OR capacity BETWEEN 1 AND 500),
  ADD CONSTRAINT sections_minimum_capacity_ck
    CHECK (minimum_capacity >= 0),
  ADD CONSTRAINT sections_capacity_range_ck
    CHECK (capacity IS NULL OR minimum_capacity <= capacity);

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
  actor_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
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
    'COHORT_PROMOTION',
    NEW.version
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_cohort_progression_history
AFTER UPDATE ON cohort_progression_state
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
  RAISE EXCEPTION 'Cohort progression events are database-owned and immutable'
    USING ERRCODE = '23514';
END;
$$;

CREATE TRIGGER db02_cohort_progression_events_immutable
BEFORE INSERT OR UPDATE OR DELETE ON cohort_progression_events
FOR EACH ROW EXECUTE FUNCTION db02_guard_progression_event_immutability();

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
     WHERE id = NEW.faculty_membership_id AND status = 'ACTIVE';
    IF faculty_college IS NULL THEN
      RAISE EXCEPTION 'Unknown or inactive faculty membership' USING ERRCODE = '23503';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM membership_roles mr
       WHERE mr.membership_id = NEW.faculty_membership_id
         AND mr.role = 'FACULTY'
    ) THEN
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
       AND (status = 'ACTIVE' OR NEW.status = 'CANCELLED');
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
   WHERE cm.id = NEW.membership_id;

  SELECT d.college_id
    INTO course_college
    FROM courses c
    JOIN departments d ON d.id = c.department_id
   WHERE c.id = NEW.course_id;

  IF membership_college IS NULL OR course_college IS NULL THEN
    RAISE EXCEPTION 'Unknown faculty membership or course'
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

-- ---------------------------------------------------------------------------
-- Registration / acceptance notes
-- ---------------------------------------------------------------------------
-- Before registration:
-- 1. Reconcile against latest main and any Chat 1 DB02 work.
-- 2. Express these tables/columns in Drizzle schema under Chat 1 ownership.
-- 3. Keep program_term_courses.display_order 1-based as the active legacy service does; do not add
--    a uniqueness constraint until reorder concurrency has executed acceptance evidence.
-- 4. Verify direct SQL cannot create cross-college term/course/period/hall/faculty-association links.
-- 5. Verify cohort start/end dates remain independently editable and ordered; verify legacy
--    class min/max/description round-trip with min >= 0, max 1..500 and min <= max.
-- 6. Verify every offering has stable program-term identity; CORE course/term mismatches fail
--    while term-bound ELECTIVE offerings remain supported.
-- 7. Verify a broad faculty-course association can exist before delivery, rejects cross-college
--    links, deactivates historically and cannot duplicate an active pair.
-- 8. Run concurrent promotion with same expected version: exactly one commit must win.
-- 9. Verify backward/jump promotions fail and immutable history matches the winner.
-- 10. Verify same-resource overlap fails while back-to-back [start,end) sessions succeed.
-- 11. Verify CANCELLED events release the scheduling resource while attendance/history remains.
-- 12. No production data backfill is required: vNext is greenfield.
