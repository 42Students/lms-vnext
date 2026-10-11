-- Unregistered DB02 integrity overlay; apply AFTER canonical DB02 and parent/enrollment
-- draft in a disposable PostgreSQL database. Chat 1 must review/inline before registration.
-- Source snapshot blob: 7d271716e998e8c1db119e1ac2b48b92e6cba272
-- Do NOT count these statements as registered or PostgreSQL verified.

-- 1) Actor privacy lifecycle: a users DELETE runs an internal FK SET NULL on
-- cohort_progression_state.updated_by_user_id. It MUST NOT require a +1 term/version
-- change or generate a false history event. The exemption requires PostgreSQL's
-- nested RI trigger depth AND an exact actor-only old/new record delta.

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
  -- Allow ONLY an FK-driven ON DELETE SET NULL of the latest actor.
  -- A direct UPDATE cannot silently bypass monotonic history.
  IF TG_OP = 'UPDATE' AND pg_trigger_depth() >= 2
     AND OLD.updated_by_user_id IS NOT NULL
     AND NEW.updated_by_user_id IS NULL
     AND (to_jsonb(NEW) - 'updated_by_user_id') =
         (to_jsonb(OLD) - 'updated_by_user_id') THEN
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
    SELECT college_id, start_date, end_date, status
      INTO period_college, period_start_day, period_end_day, period_status
      FROM academic_periods
     WHERE id = NEW.current_period_id;
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

CREATE OR REPLACE FUNCTION db02_record_cohort_progression_event()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Allow ONLY an FK-driven ON DELETE SET NULL of the latest actor.
  -- A direct UPDATE cannot silently bypass monotonic history.
  IF TG_OP = 'UPDATE' AND pg_trigger_depth() >= 2
     AND OLD.updated_by_user_id IS NOT NULL
     AND NEW.updated_by_user_id IS NULL
     AND (to_jsonb(NEW) - 'updated_by_user_id') =
         (to_jsonb(OLD) - 'updated_by_user_id') THEN
    RETURN NEW;
  END IF;

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

-- 2) State identity and lifecycle: the initializer creates one row per cohort.
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

-- 3) Prevent timestamp-only UPDATEs from resurrecting historical scheduled
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

-- Acceptance (UNEXECUTED): archived hall cannot receive future booking through
-- timestamp-only UPDATE; historical past sessions remain; archive/book race
-- serializes; deleting only academic-audit actor preserves term/version/history;
-- direct UPDATE cohort_id, DELETE and TRUNCATE progression state fail.
