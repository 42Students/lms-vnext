-- DB02 active-parent lifecycle PostgreSQL acceptance — UNREGISTERED.
-- Run only after Chat 1 registers the reviewed DB02 schema on a DISPOSABLE PostgreSQL DB.
-- Rollback-only: no fixture survives.
--
-- Proves direct SQL cannot recreate ACTIVE academic children below archived/ended parents,
-- while PLANNED periods and historical/cancelled rows keep their intended compatibility.

BEGIN;

DO $db02_active_parent$
DECLARE
  org_id uuid;
  college_id uuid;
  dept_id uuid;
  program_id uuid;
  active_period_id uuid;
  planned_period_id uuid;
  cohort_id uuid;
  inactive_cohort_id uuid;
  section_id uuid;
  archived_section_id uuid;
  planned_section_id uuid;
  course_id uuid;
  archived_course_id uuid;
  term_id uuid;
  term_course_id uuid;
  offering_id uuid;
  archived_offering_id uuid;
  delivery_id uuid;
  ended_delivery_id uuid;
  faculty_user_id uuid;
  faculty_membership_id uuid;
  learner_user_id uuid;
  learner_membership_id uuid;
  learner2_user_id uuid;
  learner2_membership_id uuid;
  learner_enrollment_id uuid;
  withdrawn_learner_enrollment_id uuid;
  planned_learner_enrollment_id uuid;
  historical_pool_id uuid;
  historical_section_faculty_id uuid;
  historical_teaching_id uuid;
  historical_section_enrollment_id uuid;
  cancelled_event_id uuid;
  failed boolean;
  future_start timestamptz := date_trunc('day', now()) + interval '14 days 09 hours';
  future_end timestamptz := date_trunc('day', now()) + interval '14 days 10 hours';
BEGIN
  INSERT INTO organizations(name)
  VALUES ('DB02 Active Parent Acceptance Org')
  RETURNING id INTO org_id;

  INSERT INTO colleges(organization_id, name, code)
  VALUES (
    org_id,
    'DB02 Active Parent College',
    'DB02-AP-' || substr(gen_random_uuid()::text,1,8)
  )
  RETURNING id INTO college_id;

  INSERT INTO departments(college_id, name)
  VALUES (college_id, 'DB02 Active Parent Department')
  RETURNING id INTO dept_id;

  INSERT INTO programs(department_id, name, code, duration_terms, status)
  VALUES (dept_id, 'DB02 Active Parent Program', 'DB02-AP-P', 4, 'ACTIVE')
  RETURNING id INTO program_id;

  INSERT INTO academic_periods(college_id, name, code, start_date, end_date, status)
  VALUES (
    college_id, 'DB02 Active Period',
    'DB02-AP-A-' || substr(gen_random_uuid()::text,1,8),
    current_date - 30, current_date + 365, 'ACTIVE'
  )
  RETURNING id INTO active_period_id;

  INSERT INTO academic_periods(college_id, name, code, start_date, end_date, status)
  VALUES (
    college_id, 'DB02 Planned Period',
    'DB02-AP-P-' || substr(gen_random_uuid()::text,1,8),
    current_date + 366, current_date + 730, 'PLANNED'
  )
  RETURNING id INTO planned_period_id;

  INSERT INTO program_terms(program_id, term_number, name, is_active)
  VALUES (program_id, 1, 'Term 1', true)
  RETURNING id INTO term_id;

  INSERT INTO courses(department_id, name, code, status)
  VALUES (dept_id, 'DB02 Active Course', 'DB02-AP-COURSE', 'ACTIVE')
  RETURNING id INTO course_id;

  INSERT INTO courses(department_id, name, code, status)
  VALUES (dept_id, 'DB02 Archived Course', 'DB02-AP-ARCH-C', 'ACTIVE')
  RETURNING id INTO archived_course_id;

  INSERT INTO program_term_courses(program_term_id, course_id, type, credits, display_order)
  VALUES (term_id, course_id, 'CORE', 3, 1)
  RETURNING id INTO term_course_id;

  INSERT INTO cohorts(
    program_id, name, code, start_period_id, expected_end_period_id, status
  )
  VALUES (
    program_id, 'DB02 Active Cohort', 'DB02-AP-COHORT',
    active_period_id, planned_period_id, 'ACTIVE'
  )
  RETURNING id INTO cohort_id;

  INSERT INTO cohorts(
    program_id, name, code, start_period_id, expected_end_period_id, status
  )
  VALUES (
    program_id, 'DB02 Inactive Cohort', 'DB02-AP-INACTIVE',
    active_period_id, planned_period_id, 'INACTIVE'
  )
  RETURNING id INTO inactive_cohort_id;

  INSERT INTO sections(
    cohort_id, academic_period_id, name, code, capacity, minimum_capacity, status
  )
  VALUES (
    cohort_id, active_period_id, 'DB02 Active Section', 'DB02-AP-S',
    40, 0, 'ACTIVE'
  )
  RETURNING id INTO section_id;

  INSERT INTO sections(
    cohort_id, academic_period_id, name, code, capacity, minimum_capacity, status
  )
  VALUES (
    cohort_id, active_period_id, 'DB02 Archived Section', 'DB02-AP-S-ARCH',
    40, 0, 'ACTIVE'
  )
  RETURNING id INTO archived_section_id;
  UPDATE sections SET status='ARCHIVED' WHERE id=archived_section_id;

  INSERT INTO sections(
    cohort_id, academic_period_id, name, code, capacity, minimum_capacity, status
  )
  VALUES (
    cohort_id, planned_period_id, 'DB02 Planned Section', 'DB02-AP-S-PLAN',
    40, 0, 'ACTIVE'
  )
  RETURNING id INTO planned_section_id;

  INSERT INTO course_offerings(
    course_id, cohort_id, academic_period_id, program_term_id, program_term_course_id,
    type, credits, display_order, status
  )
  VALUES (
    course_id, cohort_id, active_period_id, term_id, term_course_id,
    'CORE', 3, 1, 'ACTIVE'
  )
  RETURNING id INTO offering_id;

  -- Separate offering can archive because it has no delivery.
  INSERT INTO course_offerings(
    course_id, cohort_id, academic_period_id, program_term_id, program_term_course_id,
    type, credits, display_order, status
  )
  VALUES (
    course_id, cohort_id, active_period_id, term_id, term_course_id,
    'CORE', 3, 2, 'ACTIVE'
  )
  RETURNING id INTO archived_offering_id;
  UPDATE course_offerings SET status='ARCHIVED' WHERE id=archived_offering_id;

  INSERT INTO users(identity_uid, email, display_name)
  VALUES (
    'db02-ap-fac-' || gen_random_uuid()::text,
    'db02-ap-fac-' || substr(gen_random_uuid()::text,1,8) || '@example.invalid',
    'DB02 Active Parent Faculty'
  )
  RETURNING id INTO faculty_user_id;

  INSERT INTO college_memberships(user_id, college_id, status)
  VALUES (faculty_user_id, college_id, 'ACTIVE')
  RETURNING id INTO faculty_membership_id;
  INSERT INTO membership_roles(membership_id, role)
  VALUES (faculty_membership_id, 'FACULTY');

  INSERT INTO users(identity_uid, email, display_name)
  VALUES (
    'db02-ap-learner-' || gen_random_uuid()::text,
    'db02-ap-learner-' || substr(gen_random_uuid()::text,1,8) || '@example.invalid',
    'DB02 Active Parent Learner'
  )
  RETURNING id INTO learner_user_id;

  INSERT INTO college_memberships(user_id, college_id, status)
  VALUES (learner_user_id, college_id, 'ACTIVE')
  RETURNING id INTO learner_membership_id;
  INSERT INTO membership_roles(membership_id, role)
  VALUES (learner_membership_id, 'LEARNER');

  INSERT INTO users(identity_uid, email, display_name)
  VALUES (
    'db02-ap-learner2-' || gen_random_uuid()::text,
    'db02-ap-learner2-' || substr(gen_random_uuid()::text,1,8) || '@example.invalid',
    'DB02 Active Parent Learner 2'
  )
  RETURNING id INTO learner2_user_id;

  INSERT INTO college_memberships(user_id, college_id, status)
  VALUES (learner2_user_id, college_id, 'ACTIVE')
  RETURNING id INTO learner2_membership_id;
  INSERT INTO membership_roles(membership_id, role)
  VALUES (learner2_membership_id, 'LEARNER');

  -- -----------------------------------------------------------------------
  -- Faculty/course parent lifecycle
  -- -----------------------------------------------------------------------
  UPDATE courses SET status='ARCHIVED' WHERE id=archived_course_id;

  failed := false;
  BEGIN
    INSERT INTO faculty_course_associations(membership_id, course_id)
    VALUES (faculty_membership_id, archived_course_id);
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'active faculty-course association was created for archived course';
  END IF;

  -- Historical row remains representable, but it cannot be reactivated under archived course.
  INSERT INTO faculty_course_associations(
    membership_id, course_id, started_at, ended_at
  )
  VALUES (
    faculty_membership_id, archived_course_id, now() - interval '2 days', now() - interval '1 day'
  )
  RETURNING id INTO historical_pool_id;

  failed := false;
  BEGIN
    UPDATE faculty_course_associations SET ended_at=NULL WHERE id=historical_pool_id;
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'historical faculty-course association reactivated under archived course';
  END IF;

  -- -----------------------------------------------------------------------
  -- Section parent lifecycle
  -- -----------------------------------------------------------------------
  failed := false;
  BEGIN
    INSERT INTO section_faculty_assignments(section_id, membership_id, role)
    VALUES (archived_section_id, faculty_membership_id, 'FACULTY');
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'active faculty assignment was created for archived section';
  END IF;

  INSERT INTO section_faculty_assignments(
    section_id, membership_id, role, started_at, ended_at
  )
  VALUES (
    archived_section_id, faculty_membership_id, 'FACULTY',
    now() - interval '2 days', now() - interval '1 day'
  )
  RETURNING id INTO historical_section_faculty_id;

  failed := false;
  BEGIN
    UPDATE section_faculty_assignments SET ended_at=NULL
     WHERE id=historical_section_faculty_id;
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'historical faculty assignment reactivated under archived section';
  END IF;

  failed := false;
  BEGIN
    INSERT INTO course_section_deliveries(offering_id, section_id)
    VALUES (offering_id, archived_section_id);
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'active delivery was created for archived section';
  END IF;

  failed := false;
  BEGIN
    INSERT INTO course_section_deliveries(offering_id, section_id)
    VALUES (archived_offering_id, section_id);
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'active delivery was created for archived offering';
  END IF;

  failed := false;
  BEGIN
    INSERT INTO section_schedule_events(
      section_id, title, starts_at, ends_at, status
    )
    VALUES (
      archived_section_id, 'Bad archived section booking',
      future_start, future_end, 'SCHEDULED'
    );
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'scheduled event was created for archived section';
  END IF;

  -- Historical cancellation remains representable on an archived section.
  INSERT INTO section_schedule_events(
    section_id, title, starts_at, ends_at, status
  )
  VALUES (
    archived_section_id, 'Historical cancelled booking',
    future_start, future_end, 'CANCELLED'
  )
  RETURNING id INTO cancelled_event_id;

  failed := false;
  BEGIN
    UPDATE section_schedule_events SET status='SCHEDULED' WHERE id=cancelled_event_id;
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'cancelled event reactivated under archived section';
  END IF;

  -- -----------------------------------------------------------------------
  -- Delivery / teaching parent lifecycle
  -- -----------------------------------------------------------------------
  INSERT INTO course_section_deliveries(offering_id, section_id)
  VALUES (offering_id, section_id)
  RETURNING id INTO delivery_id;

  INSERT INTO course_section_deliveries(
    offering_id, section_id, started_at, ended_at
  )
  VALUES (
    offering_id, section_id, now() - interval '2 days', now() - interval '1 day'
  )
  RETURNING id INTO ended_delivery_id;

  failed := false;
  BEGIN
    INSERT INTO course_teaching_assignments(delivery_id, membership_id, role)
    VALUES (ended_delivery_id, faculty_membership_id, 'PRIMARY');
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'active teaching assignment was created for ended delivery';
  END IF;

  INSERT INTO course_teaching_assignments(
    delivery_id, membership_id, role, started_at, ended_at
  )
  VALUES (
    ended_delivery_id, faculty_membership_id, 'PRIMARY',
    now() - interval '2 days', now() - interval '1 day'
  )
  RETURNING id INTO historical_teaching_id;

  failed := false;
  BEGIN
    UPDATE course_teaching_assignments SET ended_at=NULL WHERE id=historical_teaching_id;
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'historical teaching assignment reactivated under ended delivery';
  END IF;

  -- A delivery may reactivate while all parents are still ACTIVE.
  UPDATE course_section_deliveries SET ended_at=now() WHERE id=delivery_id;
  UPDATE course_section_deliveries SET ended_at=NULL WHERE id=delivery_id;
  IF NOT EXISTS (
    SELECT 1 FROM course_section_deliveries WHERE id=delivery_id AND ended_at IS NULL
  ) THEN
    RAISE EXCEPTION 'valid delivery reactivation under active parents failed';
  END IF;

  -- -----------------------------------------------------------------------
  -- Learner program / section parent lifecycle
  -- -----------------------------------------------------------------------
  INSERT INTO learner_program_enrollments(
    membership_id, program_id, cohort_id, status
  )
  VALUES (
    learner_membership_id, program_id, cohort_id, 'ACTIVE'
  )
  RETURNING id INTO learner_enrollment_id;

  failed := false;
  BEGIN
    INSERT INTO learner_program_enrollments(
      membership_id, program_id, cohort_id, status
    )
    VALUES (
      learner2_membership_id, program_id, inactive_cohort_id, 'ACTIVE'
    );
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'active learner program enrollment was created under INACTIVE cohort';
  END IF;

  INSERT INTO learner_program_enrollments(
    membership_id, program_id, cohort_id, status, withdrawn_at
  )
  VALUES (
    learner2_membership_id, program_id, cohort_id, 'WITHDRAWN', now()
  )
  RETURNING id INTO withdrawn_learner_enrollment_id;

  failed := false;
  BEGIN
    INSERT INTO section_enrollments(
      learner_enrollment_id, section_id, academic_period_id, status
    )
    VALUES (
      withdrawn_learner_enrollment_id, section_id, active_period_id, 'ACTIVE'
    );
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'active section enrollment was created under withdrawn learner program';
  END IF;

  failed := false;
  BEGIN
    INSERT INTO section_enrollments(
      learner_enrollment_id, section_id, academic_period_id, status
    )
    VALUES (
      learner_enrollment_id, archived_section_id, active_period_id, 'ACTIVE'
    );
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'active section enrollment was created under archived section';
  END IF;

  -- PLANNED period is valid: services reject CLOSED, not PLANNED.
  INSERT INTO learner_program_enrollments(
    membership_id, program_id, cohort_id, status
  )
  VALUES (
    learner2_membership_id, program_id, cohort_id, 'ACTIVE'
  )
  RETURNING id INTO planned_learner_enrollment_id;

  INSERT INTO section_enrollments(
    learner_enrollment_id, section_id, academic_period_id, status
  )
  VALUES (
    planned_learner_enrollment_id, planned_section_id, planned_period_id, 'ACTIVE'
  );

  -- Historical section enrollment is representable but cannot reactivate under archived section.
  INSERT INTO section_enrollments(
    learner_enrollment_id, section_id, academic_period_id, status, ended_at
  )
  VALUES (
    learner_enrollment_id, archived_section_id, active_period_id, 'WITHDRAWN', now()
  )
  RETURNING id INTO historical_section_enrollment_id;

  failed := false;
  BEGIN
    UPDATE section_enrollments
       SET status='ACTIVE', ended_at=NULL
     WHERE id=historical_section_enrollment_id;
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'historical section enrollment reactivated under archived section';
  END IF;

  RAISE NOTICE 'DB02 active-parent lifecycle acceptance PASS';
END;
$db02_active_parent$;

ROLLBACK;
