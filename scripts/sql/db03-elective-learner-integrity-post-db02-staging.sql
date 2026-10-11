-- DB-026 | DATABASE phase | STAGING ONLY; NOT A NUMBERED DRIZZLE MIGRATION.
-- Prerequisite: DB02 canonical cohort_progression_state has been registered.
-- Chat 1 is the ONLY migration journal/schema-barrel integrator.
-- Oracle: legacy ElectiveService.classEligibilityError (pinned backend
-- 21bad59d4dfaf2fa11fdeaf9353327ce105697d5): primary program, current
-- batch semester and academic-year start must match the elective slot.
-- This guards direct SQL writes as well as the existing application checks.
-- Do not register before DB02. Do not claim PostgreSQL acceptance before run.

CREATE FUNCTION db03_guard_elective_member_academics()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  group_kind text;
  slot_program uuid;
  slot_college uuid;
  slot_period uuid;
  slot_semester integer;
  slot_year text;
  slot_year_start integer;
BEGIN
  IF NEW.state::text NOT IN ('ACTIVE', 'WAITLISTED') THEN
    RETURN NEW;
  END IF;
  SELECT g.kind::text INTO group_kind
    FROM lms_groups g WHERE g.id = NEW.group_id;
  IF group_kind IS DISTINCT FROM 'ELECTIVE' THEN
    RETURN NEW;
  END IF;

  SELECT s.program_id, s.college_id, s.academic_period_id,
         s.semester_number, s.academic_year
    INTO slot_program, slot_college, slot_period, slot_semester, slot_year
    FROM elective_offerings o
    JOIN elective_slots s ON s.id = o.slot_id
   WHERE o.group_id = NEW.group_id
     AND o.status = 'ACTIVE' AND o.deleted_at IS NULL
     AND s.status = 'ACTIVE' AND s.deleted_at IS NULL
   LIMIT 1;
  IF slot_program IS NULL THEN
    RAISE EXCEPTION 'DB03 elective requires a live offering and slot'
      USING ERRCODE = '23514';
  END IF;

  IF slot_year IS NOT NULL THEN
    IF slot_year !~ '^[0-9]{4}(-[0-9]{2}|-[0-9]{4})?$' THEN
      RAISE EXCEPTION 'DB03 malformed slot academic year'
        USING ERRCODE = '23514';
    END IF;
    slot_year_start := left(slot_year, 4)::integer;
  END IF;

  -- Preserve the canonical *primary* program/cohort, never infer it from a
  -- same-college enrollment or the optional academic-period UUID alone.
  -- FOR SHARE serializes this write with enrollment transfers and DB02
  -- cohort promotions updating the canonical progression state.
  PERFORM 1
    FROM learner_program_enrollments lpe
    JOIN programs p ON p.id = lpe.program_id
    JOIN departments d ON d.id = p.department_id
    JOIN section_enrollments se ON se.learner_enrollment_id = lpe.id
    JOIN sections home ON home.id = se.section_id
    JOIN cohort_progression_state cps ON cps.cohort_id = lpe.cohort_id
   WHERE lpe.membership_id = NEW.membership_id
     AND lpe.status = 'ACTIVE'
     AND lpe.program_id = slot_program
     AND d.college_id = slot_college
     AND se.status = 'ACTIVE'
     AND home.status = 'ACTIVE'
     AND home.cohort_id = lpe.cohort_id
     AND home.academic_period_id = se.academic_period_id
     AND (slot_period IS NULL OR se.academic_period_id = slot_period)
     AND cps.current_term_number = slot_semester
     AND (slot_year_start IS NULL
          OR cps.current_academic_year_start IS NULL
          OR cps.current_academic_year_start = slot_year_start)
   FOR SHARE OF lpe, se, cps;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'DB03 elective learner does not match slot program/term/year'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db03_elective_member_academics_guard
BEFORE INSERT OR UPDATE OF group_id, membership_id, state
ON lms_group_members
FOR EACH ROW EXECUTE FUNCTION db03_guard_elective_member_academics();

-- Required independent PostgreSQL witnesses once Chat 1 promotes both drafts:
-- 1. same-college different program ACTIVE/WAITLISTED => SQLSTATE 23514;
-- 2. same-program wrong current_term_number => 23514;
-- 3. slot academic year + differing known cohort year => 23514;
-- 4. either year NULL => no year-only rejection (legacy null tolerance);
-- 5. legitimate primary cohort/section in same program/term/year => accepted;
-- 6. learner transition vs membership insertion serializes (no cross-program
--    accepted member at commit); promotion vs membership insert serializes;
-- 7. unrelated BUS/PROJECT_TEAM groups are unaffected by this trigger.
-- NOTE: changing a cohort AFTER existing membership remains possible; all
-- access consumers must continue to check current eligibility at read time.
