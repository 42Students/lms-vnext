-- DB-008 / CHAT 6: READ ONLY classroom message tenant/cohort/period preflight.
-- No schema changes, no writes, no locks on application rows.
-- PostgreSQL query to run BEFORE registering the companion guard.
-- No person names, text messages, IDs or other PII are emitted.
-- This audits EXISTING rows; INSERT-time guards do not retroactively repair
-- rows from unguarded prior writes or upstream reparenting.
-- Does not prove concurrency behavior or eliminate mandatory negative tests.
-- A result with affected_messages=0 for every category is necessary,
-- never sufficient, for W01 promotion.
--
-- Source: src/db/schema/{courses,academics,departments,discussions,
-- memberships}.ts. Intended to run against same exact schema SHA.
WITH scoped AS (
  SELECT
    message.id AS message_id,
    array_remove(ARRAY[
      CASE WHEN delivery.id IS NULL THEN 'MISSING_DELIVERY'::text END,
      CASE WHEN offering.id IS NULL THEN 'MISSING_OFFERING'::text END,
      CASE WHEN course_row.id IS NULL THEN 'MISSING_COURSE'::text END,
      CASE WHEN course_department.id IS NULL THEN 'MISSING_COURSE_DEPARTMENT'::text END,
      CASE WHEN offering_period.id IS NULL THEN 'MISSING_OFFERING_PERIOD'::text END,
      CASE WHEN section_row.id IS NULL THEN 'MISSING_SECTION'::text END,
      CASE WHEN section_period.id IS NULL THEN 'MISSING_SECTION_PERIOD'::text END,
      CASE WHEN section_cohort.id IS NULL THEN 'MISSING_SECTION_COHORT'::text END,
      CASE WHEN section_program.id IS NULL THEN 'MISSING_SECTION_PROGRAM'::text END,
      CASE WHEN section_program_department.id IS NULL THEN 'MISSING_SECTION_PROGRAM_DEPARTMENT'::text END,
      CASE WHEN sender_membership.id IS NULL THEN 'MISSING_SENDER_MEMBERSHIP'::text END,
      CASE WHEN course_department.college_id IS NOT NULL AND offering_period.college_id IS NOT NULL AND course_department.college_id IS DISTINCT FROM offering_period.college_id THEN 'COURSE_OFFERING_PERIOD_COLLEGE_MISMATCH'::text END,
      CASE WHEN course_department.college_id IS NOT NULL AND section_period.college_id IS NOT NULL AND course_department.college_id IS DISTINCT FROM section_period.college_id THEN 'COURSE_SECTION_PERIOD_COLLEGE_MISMATCH'::text END,
      CASE WHEN course_department.college_id IS NOT NULL AND section_program_department.college_id IS NOT NULL AND course_department.college_id IS DISTINCT FROM section_program_department.college_id THEN 'COURSE_SECTION_PROGRAM_COLLEGE_MISMATCH'::text END,
      CASE WHEN course_department.college_id IS NOT NULL AND sender_membership.college_id IS NOT NULL AND course_department.college_id IS DISTINCT FROM sender_membership.college_id THEN 'COURSE_SENDER_COLLEGE_MISMATCH'::text END,
      CASE WHEN offering.cohort_id IS NOT NULL AND section_row.cohort_id IS NOT NULL AND offering.cohort_id IS DISTINCT FROM section_row.cohort_id THEN 'OFFERING_SECTION_COHORT_MISMATCH'::text END,
      CASE WHEN offering.academic_period_id IS NOT NULL AND section_row.academic_period_id IS NOT NULL AND offering.academic_period_id IS DISTINCT FROM section_row.academic_period_id THEN 'OFFERING_SECTION_PERIOD_MISMATCH'::text END
    ]::text[], NULL::text) AS failures
  FROM course_discussion_messages AS message
  LEFT JOIN course_section_deliveries AS delivery ON delivery.id = message.delivery_id
  LEFT JOIN course_offerings AS offering ON offering.id = delivery.offering_id
  LEFT JOIN courses AS course_row ON course_row.id = offering.course_id
  LEFT JOIN departments AS course_department ON course_department.id = course_row.department_id
  LEFT JOIN academic_periods AS offering_period ON offering_period.id = offering.academic_period_id
  LEFT JOIN sections AS section_row ON section_row.id = delivery.section_id
  LEFT JOIN academic_periods AS section_period ON section_period.id = section_row.academic_period_id
  LEFT JOIN cohorts AS section_cohort ON section_cohort.id = section_row.cohort_id
  LEFT JOIN programs AS section_program ON section_program.id = section_cohort.program_id
  LEFT JOIN departments AS section_program_department ON section_program_department.id = section_program.department_id
  LEFT JOIN college_memberships AS sender_membership ON sender_membership.id = message.sender_membership_id
),
violations AS (
  SELECT failure AS failure_code
  FROM scoped
  CROSS JOIN LATERAL unnest(scoped.failures) AS failure
),
categories AS (
  SELECT unnest(ARRAY[
    'MISSING_DELIVERY',
    'MISSING_OFFERING',
    'MISSING_COURSE',
    'MISSING_COURSE_DEPARTMENT',
    'MISSING_OFFERING_PERIOD',
    'MISSING_SECTION',
    'MISSING_SECTION_PERIOD',
    'MISSING_SECTION_COHORT',
    'MISSING_SECTION_PROGRAM',
    'MISSING_SECTION_PROGRAM_DEPARTMENT',
    'MISSING_SENDER_MEMBERSHIP',
    'COURSE_OFFERING_PERIOD_COLLEGE_MISMATCH',
    'COURSE_SECTION_PERIOD_COLLEGE_MISMATCH',
    'COURSE_SECTION_PROGRAM_COLLEGE_MISMATCH',
    'COURSE_SENDER_COLLEGE_MISMATCH',
    'OFFERING_SECTION_COHORT_MISMATCH',
    'OFFERING_SECTION_PERIOD_MISMATCH'
  ]::text[]) AS failure_code
)
SELECT
  categories.failure_code,
  count(violations.failure_code)::bigint AS affected_messages
FROM categories
LEFT JOIN violations ON violations.failure_code = categories.failure_code
GROUP BY categories.failure_code
ORDER BY categories.failure_code;

-- Acceptance: all 17 categories return 0 for a clean source database.
-- If any >0, W01 must reconcile before enabling a NOT VALID/FK/check/guard.
-- This snapshot can race active writes; run inside an approved disposable
-- DB acceptance transaction and test concurrent actors separately.
