-- DB-008 / CHAT 6. READ-ONLY PRE-INTEGRATION POSTGRES PREFLIGHT.
-- This is NOT migration DDL, NOT an eighth numbered DB05 migration, and NOT
-- executable evidence until someone actually runs it on approved disposable PG.
--
-- Evaluates EXISTING seeded rows before introducing the UNREGISTERED candidate:
-- scripts/sql/db05-offering-delivery-scope.draft.sql
-- Output includes aggregate counts ONLY, no personal/student identifiers.
-- Run in a non-production read-only transaction after baseline migrations:
--   BEGIN TRANSACTION READ ONLY;
--   \i scripts/sql/db05-offering-delivery-preflight.readonly.sql
--   COMMIT;
--
-- Enforcing future child INSERT guards does not repair existing bad rows;
-- W01 must investigate any nonzero count, avoid silently dropping history.

WITH offering_scope AS (
  SELECT
    o.id,
    course_department.college_id AS course_college,
    program_department.college_id AS cohort_program_college,
    period.college_id AS offering_period_college,
    start_period.college_id AS cohort_start_college,
    end_period.college_id AS cohort_end_college,
    cohort.expected_end_period_id,
    period.start_date AS offering_start,
    period.end_date AS offering_end,
    start_period.start_date AS cohort_start,
    end_period.end_date AS cohort_end
  FROM course_offerings o
  JOIN courses course_row ON course_row.id = o.course_id
  JOIN departments course_department ON course_department.id = course_row.department_id
  JOIN cohorts cohort ON cohort.id = o.cohort_id
  JOIN programs program_row ON program_row.id = cohort.program_id
  JOIN departments program_department ON program_department.id = program_row.department_id
  JOIN academic_periods period ON period.id = o.academic_period_id
  JOIN academic_periods start_period ON start_period.id = cohort.start_period_id
  LEFT JOIN academic_periods end_period ON end_period.id = cohort.expected_end_period_id
)
SELECT
  'db05_offering_existing_scope_preflight' AS audit_name,
  count(*) AS offerings_scanned,
  count(*) FILTER (
    WHERE course_college IS DISTINCT FROM cohort_program_college
       OR course_college IS DISTINCT FROM offering_period_college
       OR course_college IS DISTINCT FROM cohort_start_college
       OR (expected_end_period_id IS NOT NULL
           AND course_college IS DISTINCT FROM cohort_end_college)
  ) AS cross_college_or_cohort_period_college_mismatches,
  count(*) FILTER (
    WHERE offering_start < cohort_start
       OR (expected_end_period_id IS NOT NULL AND offering_end > cohort_end)
  ) AS cohort_date_bounds_mismatches
FROM offering_scope;

WITH delivery_scope AS (
  SELECT
    delivery.id,
    offering.cohort_id AS offering_cohort_id,
    offering.academic_period_id AS offering_period_id,
    section_row.cohort_id AS section_cohort_id,
    section_row.academic_period_id AS section_period_id,
    course_department.college_id AS offering_course_college,
    offering_period.college_id AS offering_period_college,
    section_period.college_id AS section_period_college,
    section_program_department.college_id AS section_program_college
  FROM course_section_deliveries delivery
  JOIN course_offerings offering ON offering.id = delivery.offering_id
  JOIN sections section_row ON section_row.id = delivery.section_id
  JOIN courses course_row ON course_row.id = offering.course_id
  JOIN departments course_department ON course_department.id = course_row.department_id
  JOIN academic_periods offering_period ON offering_period.id = offering.academic_period_id
  JOIN academic_periods section_period ON section_period.id = section_row.academic_period_id
  JOIN cohorts section_cohort ON section_cohort.id = section_row.cohort_id
  JOIN programs section_program ON section_program.id = section_cohort.program_id
  JOIN departments section_program_department
    ON section_program_department.id = section_program.department_id
)
SELECT
  'db05_delivery_existing_scope_preflight' AS audit_name,
  count(*) AS deliveries_scanned,
  count(*) FILTER (
    WHERE offering_cohort_id IS DISTINCT FROM section_cohort_id
  ) AS wrong_section_cohort_mismatches,
  count(*) FILTER (
    WHERE offering_period_id IS DISTINCT FROM section_period_id
  ) AS wrong_section_term_mismatches,
  count(*) FILTER (
    WHERE offering_course_college IS DISTINCT FROM offering_period_college
       OR offering_course_college IS DISTINCT FROM section_period_college
       OR offering_course_college IS DISTINCT FROM section_program_college
  ) AS cross_college_mismatches
FROM delivery_scope;
