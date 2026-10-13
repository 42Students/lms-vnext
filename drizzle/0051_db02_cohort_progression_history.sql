-- DB-005 registered cohort progression, immutable history, readiness, CAS version guards.
-- Application writers must additionally use a WHERE version=expectedVersion predicate.
--> statement-breakpoint
CREATE TABLE cohort_progression_state (
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

--> statement-breakpoint
CREATE INDEX cohort_progression_events_cohort_time_idx
  ON cohort_progression_events(cohort_id, created_at);

--> statement-breakpoint
INSERT INTO cohort_progression_state(cohort_id,current_term_number,current_academic_year_start,current_period_id,version)
SELECT c.id,1,EXTRACT(YEAR FROM ap.start_date)::integer -
  CASE WHEN EXTRACT(MONTH FROM ap.start_date)<7 THEN 1 ELSE 0 END,c.start_period_id,0
FROM cohorts c JOIN academic_periods ap ON ap.id=c.start_period_id
WHERE NOT EXISTS (SELECT 1 FROM cohort_progression_state cps WHERE cps.cohort_id=c.id);

--> statement-breakpoint
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

--> statement-breakpoint
CREATE TRIGGER db02_cohort_progression_state_guard
BEFORE INSERT OR UPDATE OF current_term_number, current_academic_year_start, current_period_id, version, updated_by_user_id
ON cohort_progression_state
FOR EACH ROW EXECUTE FUNCTION db02_guard_cohort_progression_state();

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
--> statement-breakpoint
CREATE FUNCTION db02_guard_cohort_promotion_readiness()
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
CREATE TRIGGER db02_cohort_promotion_readiness_guard
BEFORE UPDATE OF current_term_number
ON cohort_progression_state
FOR EACH ROW EXECUTE FUNCTION db02_guard_cohort_promotion_readiness();


-- Database-owned history: a direct SQL update cannot advance canonical state without
-- producing a matching immutable event. Application code must NOT insert a duplicate event.
--> statement-breakpoint
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

--> statement-breakpoint
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
--> statement-breakpoint
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

--> statement-breakpoint
CREATE TRIGGER db02_cohort_progression_events_immutable
BEFORE INSERT OR UPDATE OR DELETE ON cohort_progression_events
FOR EACH ROW EXECUTE FUNCTION db02_guard_progression_event_immutability();

--> statement-breakpoint
CREATE TRIGGER db02_cohort_progression_events_no_truncate
BEFORE TRUNCATE ON cohort_progression_events
FOR EACH STATEMENT EXECUTE FUNCTION db02_guard_progression_event_immutability();

-- Ensure every newly created cohort has exactly one canonical term/year row.
-- The initial July-boundary year is only a default; an explicit user-supplied
-- legacy year override still needs a reviewed cohort creation API contract.
--> statement-breakpoint
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

--> statement-breakpoint
CREATE TRIGGER db02_cohort_progression_initialize
AFTER INSERT ON cohorts
FOR EACH ROW EXECUTE FUNCTION db02_initialize_cohort_progression_state();

-- A program cannot shrink below an existing term or promoted cohort.
-- Program term inserts and cohort promotion also lock the program row FOR SHARE,
-- serializing concurrent duration reduction with active academic writes.
--> statement-breakpoint
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

--> statement-breakpoint
CREATE TRIGGER db02_program_duration_reduction_guard
BEFORE UPDATE OF duration_terms ON programs
FOR EACH ROW EXECUTE FUNCTION db02_guard_program_duration_reduction();

-- ---------------------------------------------------------------------------
