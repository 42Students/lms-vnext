-- DB02 / DB-005 — UNREGISTERED database enforcement for legacy batch promotion.
-- Legacy source: 42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5
-- BatchServiceImpl.validatePromotion: source batch must be ACTIVE, next semester
-- must exist/isActive/notDeleted and contain at least one semester-course mapping.
--
-- Apply AFTER canonical DB02 staging on a disposable PostgreSQL database only.
-- Chat 1 owns numbered Drizzle migration and schema registration.
-- No tests / migration replay were executed when this draft was authored.
--
-- Scope intentionally limited: INSERT still starts at semester 1 even if the
-- college has not configured curriculum; updates that only correct academic-year
-- or period without changing term do not require a new target semester.
-- Staffing readiness is informational in legacy preview; DO NOT require faculty
-- assignments for promotion. Cancellation/history rules remain in canonical DB02.

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

CREATE TRIGGER db02_cohort_promotion_readiness_guard
BEFORE UPDATE OF current_term_number
ON cohort_progression_state
FOR EACH ROW EXECUTE FUNCTION db02_guard_cohort_promotion_readiness();

-- Integration notes / acceptance gaps:
-- (1) PostgreSQL cannot infer the caller's expected old version: API must retain
--     UPDATE ... WHERE cohort_id=:id AND version=:expectedVersion CAS predicate.
-- (2) Faculty-teaching assignment deactivation must remain transactional in the
--     eventual API/service; this guard does not misrepresent staffing as a DB FK.
-- (3) Check deadlock/lock order in disposable PG vs semester/course deactivation,
--     semester-course deletion, cohort completion and concurrent CAS promotion.
-- (4) Existing DB02 code permits curriculum edits AFTER historical promotions;
--     this guard validates readiness at promotion time without freezing all
--     future course/term admin maintenance or deleting academic history.
-- (5) Run scripts/sql/db02-promotion-readiness-acceptance-unregistered.sql.
