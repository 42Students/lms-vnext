-- Chat 6 / DB-008 / DATABASE. UNREGISTERED COMPANION ONLY.
-- Not an eighth independently numbered DB05 migration.
-- ONLY Chat 1 owns Drizzle journal/schema barrel/clean replay.
--
-- vNext source oracle:
--   src/db/schema/courses.ts course_offerings/course_section_deliveries
--   src/db/schema/academics.ts cohorts/programs/academic_periods/sections
--   src/modules/courses/offering-service.ts validateOfferingStructure
--   src/modules/courses/delivery-service.ts createCourseSectionDelivery
--
-- Independent FKs allow a course from college A to be offered to the
-- cohort/academic period of college B by direct SQL, and let a delivery
-- point at the wrong cohort or term of the SAME college. API validation
-- covers normal creates but not seed/bulk/admin direct database operations.
-- This candidate mirrors existing API's structural invariants, not a
-- proposed new authorization policy. Archived/historical row behavior
-- and upstream edits remain separate integration decisions.
--
-- CRITICAL: child BEFORE INSERT/UPDATE checks do NOT prevent later moving:
-- departments.college_id, programs.department_id, cohorts.program_id,
-- academic_periods.college_id/start_date/end_date, sections.cohort_id/period,
-- or course_offerings.course_id/cohort_id/period without separate ancestors.
-- Shared advisory key 605008003 serializes with DB05 content/order guards
-- under READ COMMITTED, but multi-key deadlock/ancestor race PG proof is OPEN.
BEGIN;

CREATE OR REPLACE FUNCTION db05_course_offering_scope_guard()
RETURNS trigger LANGUAGE plpgsql AS $db05_offering_scope$
DECLARE
  course_college_id uuid;
  cohort_program_college_id uuid;
  offering_period_college_id uuid;
  cohort_start_college_id uuid;
  cohort_end_college_id uuid;
  current_period_start date;
  current_period_end date;
  cohort_start_date date;
  cohort_end_date date;
  has_cohort_end boolean;
BEGIN
  IF current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION 'DB05 offering scope write requires READ COMMITTED'
      USING ERRCODE = '25001';
  END IF;
  PERFORM pg_advisory_xact_lock(605008003::bigint);

  SELECT course_department.college_id,
         program_department.college_id,
         period.college_id,
         start_period.college_id,
         end_period.college_id,
         period.start_date,
         period.end_date,
         start_period.start_date,
         end_period.end_date,
         cohort.expected_end_period_id IS NOT NULL
    INTO course_college_id,
         cohort_program_college_id,
         offering_period_college_id,
         cohort_start_college_id,
         cohort_end_college_id,
         current_period_start,
         current_period_end,
         cohort_start_date,
         cohort_end_date,
         has_cohort_end
  FROM courses course_row
  JOIN departments course_department ON course_department.id = course_row.department_id
  CROSS JOIN cohorts cohort
  JOIN programs program_row ON program_row.id = cohort.program_id
  JOIN departments program_department ON program_department.id = program_row.department_id
  JOIN academic_periods start_period ON start_period.id = cohort.start_period_id
  LEFT JOIN academic_periods end_period ON end_period.id = cohort.expected_end_period_id
  JOIN academic_periods period ON period.id = NEW.academic_period_id
  WHERE course_row.id = NEW.course_id
    AND cohort.id = NEW.cohort_id;

  IF course_college_id IS NULL
     OR cohort_program_college_id IS NULL
     OR offering_period_college_id IS NULL
     OR cohort_start_college_id IS NULL
     OR course_college_id IS DISTINCT FROM cohort_program_college_id
     OR course_college_id IS DISTINCT FROM offering_period_college_id
     OR course_college_id IS DISTINCT FROM cohort_start_college_id
     OR (has_cohort_end AND (
          cohort_end_college_id IS NULL OR
          course_college_id IS DISTINCT FROM cohort_end_college_id))
  THEN
    RAISE EXCEPTION 'DB05 course offering course/cohort/period college mismatch'
      USING ERRCODE = '23514';
  END IF;

  IF current_period_start < cohort_start_date
     OR (has_cohort_end AND current_period_end > cohort_end_date)
  THEN
    RAISE EXCEPTION 'DB05 course offering outside cohort academic period bounds'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$db05_offering_scope$;

CREATE TRIGGER db05_course_offering_scope_before_write
BEFORE INSERT OR UPDATE OF course_id, cohort_id, academic_period_id
ON course_offerings
FOR EACH ROW EXECUTE FUNCTION db05_course_offering_scope_guard();

CREATE OR REPLACE FUNCTION db05_course_delivery_scope_guard()
RETURNS trigger LANGUAGE plpgsql AS $db05_delivery_scope$
DECLARE
  offering_cohort_id uuid;
  offering_period_id uuid;
  offering_course_college_id uuid;
  offering_period_college_id uuid;
  section_cohort_id uuid;
  section_period_id uuid;
  section_period_college_id uuid;
  section_program_college_id uuid;
BEGIN
  IF current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION 'DB05 delivery scope write requires READ COMMITTED'
      USING ERRCODE = '25001';
  END IF;
  PERFORM pg_advisory_xact_lock(605008003::bigint);

  SELECT offering.cohort_id, offering.academic_period_id,
         course_department.college_id, offering_period.college_id
    INTO offering_cohort_id, offering_period_id,
         offering_course_college_id, offering_period_college_id
  FROM course_offerings offering
  JOIN courses course_row ON course_row.id = offering.course_id
  JOIN departments course_department ON course_department.id = course_row.department_id
  JOIN academic_periods offering_period ON offering_period.id = offering.academic_period_id
  WHERE offering.id = NEW.offering_id;

  SELECT section_row.cohort_id, section_row.academic_period_id,
         section_period.college_id, program_department.college_id
    INTO section_cohort_id, section_period_id,
         section_period_college_id, section_program_college_id
  FROM sections section_row
  JOIN academic_periods section_period ON section_period.id = section_row.academic_period_id
  JOIN cohorts cohort ON cohort.id = section_row.cohort_id
  JOIN programs program_row ON program_row.id = cohort.program_id
  JOIN departments program_department ON program_department.id = program_row.department_id
  WHERE section_row.id = NEW.section_id;

  IF offering_cohort_id IS NULL OR offering_period_id IS NULL
     OR offering_course_college_id IS NULL OR offering_period_college_id IS NULL
     OR section_cohort_id IS NULL OR section_period_id IS NULL
     OR section_period_college_id IS NULL OR section_program_college_id IS NULL
     OR offering_cohort_id IS DISTINCT FROM section_cohort_id
     OR offering_period_id IS DISTINCT FROM section_period_id
     OR offering_course_college_id IS DISTINCT FROM offering_period_college_id
     OR offering_course_college_id IS DISTINCT FROM section_period_college_id
     OR offering_course_college_id IS DISTINCT FROM section_program_college_id
  THEN
    RAISE EXCEPTION 'DB05 delivery offering/section cohort/period/college mismatch'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$db05_delivery_scope$;

CREATE TRIGGER db05_course_delivery_scope_before_write
BEFORE INSERT OR UPDATE OF offering_id, section_id
ON course_section_deliveries
FOR EACH ROW EXECUTE FUNCTION db05_course_delivery_scope_guard();

COMMIT;

-- Required real disposable PostgreSQL acceptance, NONE EXECUTED:
-- 1. Same-college course/cohort/period offering accepted.
-- 2. Course college != program.department college rejected 23514.
-- 3. Same college but different start period bounds rejected 23514.
-- 4. Wrong-college cohort.start_period/end_period rejected 23514.
-- 5. Same college matching section cohort/term/college delivery accepted.
-- 6. Same college WRONG section cohort rejected 23514.
-- 7. Same college WRONG section academic period rejected 23514.
-- 8. Wrong-college section academic period/program rejected 23514.
-- 9. UPDATE offering parent keys or delivery parent keys rejected on mismatch.
-- 10. New/archived offering status and delivered/history access separately gated.
-- 11. Later department/program/cohort/period/section move (upstream) must
--     either be immutable when descendants exist or revalidate and reject.
-- 12. Two-session offering/delivery insert-vs-parent-move under READ COMMITTED
--     and consistency of advisory key 605008003, deadlock lock ordering,
--     concurrent archive/delete/restore and migration rollback.
-- 13. Integrate exactly once; no numbered migration/trigger duplication.
