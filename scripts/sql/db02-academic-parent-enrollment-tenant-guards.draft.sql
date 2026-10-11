-- DB02 additive DRAFT ONLY, not a registered migration. Apply AFTER the canonical
-- db02-academic-progression-and-rooms-staging.sql draft, then consolidate into
-- Chat 1-owned numbered Drizzle migrations after cross-domain review.
-- Source: docs/planning/db02-academic-progression-contract.md
-- Objective: make database-native tenant claims stable under UPDATE/reparent.
-- Existing 0002 schema has independent FKs but no compound tenant/cohort FKs.

-- These identities are ownership roots; an account/program/period move between
-- colleges must create a new scoped record, not mutate the history of an old one.
CREATE FUNCTION db02_guard_college_owner_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.college_id IS DISTINCT FROM OLD.college_id THEN
    RAISE EXCEPTION 'DB02 tenant owner college cannot change in place'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_department_college_immutable
BEFORE UPDATE OF college_id ON departments
FOR EACH ROW EXECUTE FUNCTION db02_guard_college_owner_immutable();

CREATE TRIGGER db02_academic_period_college_immutable
BEFORE UPDATE OF college_id ON academic_periods
FOR EACH ROW EXECUTE FUNCTION db02_guard_college_owner_immutable();

CREATE TRIGGER db02_membership_college_immutable
BEFORE UPDATE OF college_id ON college_memberships
FOR EACH ROW EXECUTE FUNCTION db02_guard_college_owner_immutable();

CREATE TRIGGER db02_lecture_hall_college_immutable
BEFORE UPDATE OF college_id ON lecture_halls
FOR EACH ROW EXECUTE FUNCTION db02_guard_college_owner_immutable();

-- Program and course owners may change *departments within the same college*.
-- This preserves the actual NewProgramServiceImpl same-college reassignment
-- contract while rejecting an out-of-tenant department switch by direct SQL.
CREATE FUNCTION db02_guard_department_reassignment_college()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  old_college uuid;
  new_college uuid;
BEGIN
  IF NEW.department_id IS NOT DISTINCT FROM OLD.department_id THEN
    RETURN NEW;
  END IF;
  SELECT college_id INTO old_college FROM departments WHERE id = OLD.department_id FOR SHARE;
  SELECT college_id INTO new_college FROM departments WHERE id = NEW.department_id FOR SHARE;
  IF old_college IS NULL OR new_college IS NULL OR old_college <> new_college THEN
    RAISE EXCEPTION 'DB02 department reassignment cannot cross colleges'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_program_department_reassignment_scope
BEFORE UPDATE OF department_id ON programs
FOR EACH ROW EXECUTE FUNCTION db02_guard_department_reassignment_college();

CREATE TRIGGER db02_course_department_reassignment_scope
BEFORE UPDATE OF department_id ON courses
FOR EACH ROW EXECUTE FUNCTION db02_guard_department_reassignment_college();

-- BatchServiceImpl explicitly forbids moving a batch to another program.
-- The program-term ordinal is a stable identity used by teaching and offerings.
CREATE FUNCTION db02_guard_immutable_academic_parent()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_TABLE_NAME = 'cohorts'
     AND NEW.program_id IS DISTINCT FROM OLD.program_id THEN
    RAISE EXCEPTION 'DB02 cohort program is immutable; use a controlled transfer'
      USING ERRCODE = '23514';
  END IF;
  IF TG_TABLE_NAME = 'program_terms'
     AND (NEW.program_id IS DISTINCT FROM OLD.program_id
       OR NEW.term_number IS DISTINCT FROM OLD.term_number) THEN
    RAISE EXCEPTION 'DB02 program term identity is immutable'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_cohort_program_immutable
BEFORE UPDATE OF program_id ON cohorts
FOR EACH ROW EXECUTE FUNCTION db02_guard_immutable_academic_parent();

CREATE TRIGGER db02_program_term_identity_immutable
BEFORE UPDATE OF program_id, term_number ON program_terms
FOR EACH ROW EXECUTE FUNCTION db02_guard_immutable_academic_parent();

-- Independent reference FKs alone do not prove that a cohort's academic
-- calendar periods belong to its parent program's college.
CREATE FUNCTION db02_guard_cohort_period_tenant()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  owner_college uuid;
  start_college uuid;
  end_college uuid;
BEGIN
  SELECT d.college_id INTO owner_college
    FROM programs p JOIN departments d ON d.id = p.department_id
   WHERE p.id = NEW.program_id;
  SELECT college_id INTO start_college FROM academic_periods WHERE id = NEW.start_period_id;
  IF owner_college IS NULL OR start_college IS DISTINCT FROM owner_college THEN
    RAISE EXCEPTION 'DB02 cohort starting period must match program college'
      USING ERRCODE = '23514';
  END IF;
  IF NEW.expected_end_period_id IS NOT NULL THEN
    SELECT college_id INTO end_college
      FROM academic_periods WHERE id = NEW.expected_end_period_id;
    IF end_college IS DISTINCT FROM owner_college THEN
      RAISE EXCEPTION 'DB02 cohort expected ending period must match program college'
        USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_cohort_period_tenant
BEFORE INSERT OR UPDATE OF program_id, start_period_id, expected_end_period_id ON cohorts
FOR EACH ROW EXECUTE FUNCTION db02_guard_cohort_period_tenant();

CREATE FUNCTION db02_guard_section_period_tenant()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  owner_college uuid;
  period_college uuid;
BEGIN
  SELECT d.college_id INTO owner_college
    FROM cohorts c JOIN programs p ON p.id = c.program_id
    JOIN departments d ON d.id = p.department_id
   WHERE c.id = NEW.cohort_id;
  SELECT college_id INTO period_college
    FROM academic_periods WHERE id = NEW.academic_period_id;
  IF owner_college IS NULL OR period_college IS DISTINCT FROM owner_college THEN
    RAISE EXCEPTION 'DB02 section period must match cohort college'
      USING ERRCODE = '23514';
  END IF;

  -- Legacy classes can be reassigned through ClassServiceImpl.updateClass;
  -- never silently rewrite already recorded learner/course/schedule history.
  -- Empty sections can still be reparented within the same college.
  IF TG_OP = 'UPDATE'
     AND (NEW.cohort_id IS DISTINCT FROM OLD.cohort_id
       OR NEW.academic_period_id IS DISTINCT FROM OLD.academic_period_id)
     AND (
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

CREATE TRIGGER db02_section_period_tenant
BEFORE INSERT OR UPDATE OF cohort_id, academic_period_id ON sections
FOR EACH ROW EXECUTE FUNCTION db02_guard_section_period_tenant();

-- Tenant-owned membership + program + cohort must all describe one college and
-- one program; existing individual FKs do not guarantee this.
CREATE FUNCTION db02_guard_learner_program_enrollment_tenant()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  membership_college uuid;
  program_college uuid;
  cohort_program uuid;
BEGIN
  SELECT college_id INTO membership_college
    FROM college_memberships WHERE id = NEW.membership_id;
  SELECT d.college_id INTO program_college
    FROM programs p JOIN departments d ON d.id = p.department_id
   WHERE p.id = NEW.program_id;
  SELECT program_id INTO cohort_program
    FROM cohorts WHERE id = NEW.cohort_id;

  IF membership_college IS NULL OR program_college IS NULL
     OR cohort_program IS NULL OR membership_college <> program_college
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
  SELECT cohort_id INTO learner_cohort
    FROM learner_program_enrollments WHERE id = NEW.learner_enrollment_id;
  SELECT cohort_id, academic_period_id INTO target_cohort, target_period
    FROM sections WHERE id = NEW.section_id;

  IF learner_cohort IS NULL OR target_cohort IS NULL OR target_period IS NULL
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

-- Faculty advisor/coordinator relationships must be rooted in the section
-- college; this is not guaranteed by their independent UUID foreign keys.
CREATE FUNCTION db02_guard_section_faculty_assignment_tenant()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  section_college uuid;
  membership_college uuid;
BEGIN
  SELECT d.college_id INTO section_college
    FROM sections s JOIN cohorts c ON c.id = s.cohort_id
    JOIN programs p ON p.id = c.program_id
    JOIN departments d ON d.id = p.department_id
   WHERE s.id = NEW.section_id;
  SELECT college_id INTO membership_college
    FROM college_memberships WHERE id = NEW.membership_id;
  IF section_college IS NULL OR membership_college IS NULL
     OR section_college <> membership_college THEN
    RAISE EXCEPTION 'DB02 faculty section assignment must match college'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_section_faculty_assignment_tenant
BEFORE INSERT OR UPDATE OF section_id, membership_id ON section_faculty_assignments
FOR EACH ROW EXECUTE FUNCTION db02_guard_section_faculty_assignment_tenant();

-- Chat 1 integration gates:
-- 1. Check which parent/membership guards already exist in DB01 or newer
--    numbered migrations; consolidate, do not double-register equivalent triggers.
-- 2. Test same-college program/course department reassignment remains permitted,
--    cross-college reassignment is denied, and ownership-root moves are denied.
-- 3. Test invalid direct SQL cohort/period, section/period, member/program/cohort,
--    learner/section/period, and faculty/section scopes all fail.
-- 4. Test valid learner enrollment/section transfer into a new period remains
--    possible with the same primary cohort and full learner history.
-- 5. Test direct SQL section reparent with existing historical references fails;
--    establish a separate audited controlled-transfer operation for legacy parity.
-- 6. Test concurrent parent scope updates versus child INSERT for tenant drift.
-- 7. This is UNREGISTERED and NO PostgreSQL or CI tests have been executed.
