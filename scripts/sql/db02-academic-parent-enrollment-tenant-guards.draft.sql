-- DB02 additive DRAFT ONLY, not a registered migration.
-- Apply AFTER scripts/sql/db02-academic-progression-and-rooms-staging.sql.
-- Chat 1 must consolidate both drafts into one numbered Drizzle migration set.
--
-- IMPORTANT: canonical DB02 already owns:
--   * department college immutability;
--   * program/course same-college department moves;
--   * cohort/section/offering period tenant + window guards;
--   * section/course teaching faculty tenant + FACULTY-role guards;
--   * delivery/event scope integrity.
-- This extension intentionally does NOT redefine those functions/triggers.
--
-- Objective here: close the remaining parent/enrollment/history invariants.

-- ---------------------------------------------------------------------------
-- 1) Remaining tenant-owner roots are immutable
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

CREATE TRIGGER db02_membership_college_immutable
BEFORE UPDATE OF college_id ON college_memberships
FOR EACH ROW EXECUTE FUNCTION db02_guard_remaining_college_owner_immutable();

CREATE TRIGGER db02_lecture_hall_college_immutable
BEFORE UPDATE OF college_id ON lecture_halls
FOR EACH ROW EXECUTE FUNCTION db02_guard_remaining_college_owner_immutable();

-- ---------------------------------------------------------------------------
-- 2) Academic parent identity cannot be silently rewritten
-- ---------------------------------------------------------------------------
-- Legacy BatchService rejects moving an existing batch/cohort to another program.
-- vNext also treats the start period as creation identity. A controlled transfer must
-- create explicit history instead of rewriting the parent keys in place.
CREATE FUNCTION db02_guard_immutable_academic_parent()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_TABLE_NAME = 'cohorts'
     AND (
       NEW.program_id IS DISTINCT FROM OLD.program_id
       OR NEW.start_period_id IS DISTINCT FROM OLD.start_period_id
     ) THEN
    RAISE EXCEPTION 'DB02 cohort program/start period are immutable; use a controlled transfer'
      USING ERRCODE = '23514';
  END IF;

  IF TG_TABLE_NAME = 'program_terms'
     AND (
       NEW.program_id IS DISTINCT FROM OLD.program_id
       OR NEW.term_number IS DISTINCT FROM OLD.term_number
     ) THEN
    RAISE EXCEPTION 'DB02 program term identity is immutable'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_cohort_program_immutable
BEFORE UPDATE OF program_id, start_period_id ON cohorts
FOR EACH ROW EXECUTE FUNCTION db02_guard_immutable_academic_parent();

CREATE TRIGGER db02_program_term_identity_immutable
BEFORE UPDATE OF program_id, term_number ON program_terms
FOR EACH ROW EXECUTE FUNCTION db02_guard_immutable_academic_parent();

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
-- 3) Learner program/section enrollment scope
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
-- 3b) Learner identity lifecycle closes active academic state
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
-- 4) Serialize history creation against section structural movement
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
-- 5) Enrollment identity is historical, not mutable parentage
-- ---------------------------------------------------------------------------
CREATE FUNCTION db02_guard_academic_enrollment_identity_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_TABLE_NAME = 'learner_program_enrollments' THEN
    IF NEW.membership_id IS DISTINCT FROM OLD.membership_id
       OR NEW.program_id IS DISTINCT FROM OLD.program_id
       OR NEW.cohort_id IS DISTINCT FROM OLD.cohort_id THEN
      RAISE EXCEPTION 'DB02 learner program enrollment identity is immutable'
        USING ERRCODE = '23514';
    END IF;
  ELSIF TG_TABLE_NAME = 'section_enrollments' THEN
    IF NEW.learner_enrollment_id IS DISTINCT FROM OLD.learner_enrollment_id
       OR NEW.section_id IS DISTINCT FROM OLD.section_id
       OR NEW.academic_period_id IS DISTINCT FROM OLD.academic_period_id THEN
      RAISE EXCEPTION 'DB02 section enrollment history identity is immutable'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_academic_enrollment_identity_immutable
BEFORE UPDATE OF membership_id, program_id, cohort_id
ON learner_program_enrollments
FOR EACH ROW EXECUTE FUNCTION db02_guard_academic_enrollment_identity_immutable();

CREATE TRIGGER db02_section_enrollment_identity_immutable
BEFORE UPDATE OF learner_enrollment_id, section_id, academic_period_id
ON section_enrollments
FOR EACH ROW EXECUTE FUNCTION db02_guard_academic_enrollment_identity_immutable();

-- ---------------------------------------------------------------------------
-- Chat 1 integration gates
-- ---------------------------------------------------------------------------
-- 1. Consolidate this extension with canonical DB02; do not register duplicate trigger names.
-- 2. Confirm zero trigger-name overlap between the two drafts.
-- 3. Test academic-period, membership and lecture-hall college ownership immutability.
-- 4. Test cohort program/start-period and program-term identity immutability.
-- 5. Test valid empty-section same-college/window reparenting and reject reparent after any
--    learner/faculty/delivery/schedule history exists.
-- 6. Test invalid direct SQL member/program/cohort and learner/section/period scopes.
-- 7. Test valid learner enrollment/section transfer by ending prior history and creating a new row.
-- 8. Test concurrent section move versus learner/faculty/delivery/schedule history insertion.
-- 9. Test LEARNER role removal and membership END withdraw active section/program enrollment,
--    while SUSPENDED membership preserves academic enrollment/current-student semantics.
-- 10. Compatibility current_students must count DISTINCT active learner-program enrollments that
--     have an ACTIVE section_enrollment in an ACTIVE section of that cohort; unsectioned learners
--     must not inflate the count.
-- 11. This file is UNREGISTERED. No PostgreSQL/runtime PASS is claimed.
