-- DB02 PostgreSQL acceptance harness — UNREGISTERED.
-- Run only AFTER Chat 1 registers the reviewed DB02 schema/migration on a disposable
-- PostgreSQL database. This script is transactional and ends with ROLLBACK.
--
-- It deliberately does NOT claim the two-session concurrency gates:
--   * cohort promotion compare-and-set single winner
--   * lecture-hall archive vs booking single winner
-- Those require separate concurrent sessions.
--
-- Expected result: one NOTICE ending in "DB02 single-session acceptance PASS"
-- and then a clean ROLLBACK with no persisted fixture rows.

BEGIN;

DO $db02_accept$
DECLARE
  org_a uuid;
  org_b uuid;
  college_a uuid;
  college_b uuid;
  dept_a uuid;
  dept_b uuid;
  program_a uuid;
  program_b uuid;
  period_a uuid;
  period_b uuid;
  period_a_outside uuid;
  cohort_a uuid;
  cohort_b uuid;
  term_a1 uuid;
  term_a2 uuid;
  course_core_a uuid;
  course_elective_a uuid;
  course_b uuid;
  section_a uuid;
  section_b uuid;
  elective_offering_a uuid;
  delivery_a uuid;
  event_section_b uuid;
  user_faculty_a uuid;
  faculty_membership_a uuid;
  user_faculty_b uuid;
  faculty_membership_b uuid;
  hall_a uuid;
  assoc_a uuid;
  teaching_a uuid;
  section_faculty_a uuid;
  lifecycle_event uuid;
  event_a uuid;
  event_b uuid;
  progression_version bigint;
  progression_term integer;
  event_count integer;
  ended_at_seen timestamptz;
  period_start date := current_date - 30;
  period_end date := current_date + 365;
  slot_a_start timestamptz := date_trunc('day', now()) + interval '7 days 09 hours';
  slot_a_end timestamptz := date_trunc('day', now()) + interval '7 days 10 hours';
  slot_overlap_start timestamptz := date_trunc('day', now()) + interval '7 days 09 hours 30 minutes';
  slot_overlap_end timestamptz := date_trunc('day', now()) + interval '7 days 10 hours 30 minutes';
  slot_b_start timestamptz := date_trunc('day', now()) + interval '7 days 10 hours';
  slot_b_end timestamptz := date_trunc('day', now()) + interval '7 days 11 hours';
  slot_archived_start timestamptz := date_trunc('day', now()) + interval '8 days 09 hours';
  slot_archived_end timestamptz := date_trunc('day', now()) + interval '8 days 10 hours';
  failed boolean;
BEGIN
  -- -------------------------------------------------------------------------
  -- Base two-tenant fixture
  -- -------------------------------------------------------------------------
  INSERT INTO organizations(name) VALUES ('DB02 Acceptance Org A') RETURNING id INTO org_a;
  INSERT INTO organizations(name) VALUES ('DB02 Acceptance Org B') RETURNING id INTO org_b;

  INSERT INTO colleges(organization_id, name, code)
  VALUES (org_a, 'DB02 Acceptance College A', 'DB02-A-' || substr(gen_random_uuid()::text, 1, 8))
  RETURNING id INTO college_a;

  INSERT INTO colleges(organization_id, name, code)
  VALUES (org_b, 'DB02 Acceptance College B', 'DB02-B-' || substr(gen_random_uuid()::text, 1, 8))
  RETURNING id INTO college_b;

  INSERT INTO departments(college_id, name)
  VALUES (college_a, 'DB02 Acceptance Dept A') RETURNING id INTO dept_a;
  INSERT INTO departments(college_id, name)
  VALUES (college_b, 'DB02 Acceptance Dept B') RETURNING id INTO dept_b;

  INSERT INTO programs(department_id, name, code, duration_terms)
  VALUES (dept_a, 'DB02 Program A', 'DB02-PA', 4) RETURNING id INTO program_a;
  INSERT INTO programs(department_id, name, code, duration_terms)
  VALUES (dept_b, 'DB02 Program B', 'DB02-PB', 4) RETURNING id INTO program_b;

  INSERT INTO academic_periods(college_id, name, code, start_date, end_date, status)
  VALUES (college_a, 'DB02 Acceptance Period A', 'DB02-A-' || substr(gen_random_uuid()::text,1,8),
          period_start, period_end, 'ACTIVE')
  RETURNING id INTO period_a;

  INSERT INTO academic_periods(college_id, name, code, start_date, end_date, status)
  VALUES (college_b, 'DB02 Acceptance Period B', 'DB02-B-' || substr(gen_random_uuid()::text,1,8),
          period_start, period_end, 'ACTIVE')
  RETURNING id INTO period_b;

  INSERT INTO academic_periods(college_id, name, code, start_date, end_date, status)
  VALUES (college_a, 'DB02 Outside Period A', 'DB02-A-OUT-' || substr(gen_random_uuid()::text,1,8),
          period_end + 1, period_end + 90, 'ACTIVE')
  RETURNING id INTO period_a_outside;

  INSERT INTO courses(department_id, name, code)
  VALUES (dept_a, 'DB02 Core A', 'DB02-CORE-A') RETURNING id INTO course_core_a;
  INSERT INTO courses(department_id, name, code)
  VALUES (dept_a, 'DB02 Elective A', 'DB02-ELECTIVE-A') RETURNING id INTO course_elective_a;
  INSERT INTO courses(department_id, name, code)
  VALUES (dept_b, 'DB02 Course B', 'DB02-COURSE-B') RETURNING id INTO course_b;

  INSERT INTO program_terms(program_id, term_number, name, is_active, total_credits)
  VALUES (program_a, 1, 'Term 1', true, 24) RETURNING id INTO term_a1;
  INSERT INTO program_terms(program_id, term_number, name, is_active, total_credits)
  VALUES (program_a, 2, 'Term 2', true, 24) RETURNING id INTO term_a2;

  INSERT INTO program_term_courses(program_term_id, course_id, type, credits, display_order)
  VALUES (term_a1, course_core_a, 'CORE', 4, 1);

  INSERT INTO cohorts(program_id, name, code, start_period_id, expected_end_period_id, status,
                      start_date, end_date)
  VALUES (program_a, 'DB02 Cohort A', 'DB02-CA', period_a, period_a, 'ACTIVE',
          period_start, period_end)
  RETURNING id INTO cohort_a;

  INSERT INTO cohorts(program_id, name, code, start_period_id, expected_end_period_id, status,
                      start_date, end_date)
  VALUES (program_b, 'DB02 Cohort B', 'DB02-CB', period_b, period_b, 'ACTIVE',
          period_start, period_end)
  RETURNING id INTO cohort_b;

  SELECT current_term_number, version
    INTO progression_term, progression_version
    FROM cohort_progression_state
   WHERE cohort_id = cohort_a;

  IF progression_term <> 1 OR progression_version <> 0 THEN
    RAISE EXCEPTION 'cohort progression initializer mismatch: term %, version %',
      progression_term, progression_version;
  END IF;

  INSERT INTO sections(cohort_id, academic_period_id, name, code, capacity,
                       minimum_capacity, description, start_date, end_date)
  VALUES (cohort_a, period_a, 'Section A', 'DB02-SEC-A', 60, 10,
          'DB02 acceptance section', period_start, period_end)
  RETURNING id INTO section_a;

  INSERT INTO sections(cohort_id, academic_period_id, name, code, capacity,
                       minimum_capacity, description, start_date, end_date)
  VALUES (cohort_b, period_b, 'Section B', 'DB02-SEC-B', 60, 0,
          'DB02 cross-tenant section', period_start, period_end)
  RETURNING id INTO section_b;

  INSERT INTO users(identity_uid, email, display_name)
  VALUES ('db02-fac-a-' || gen_random_uuid()::text,
          'db02-fac-a-' || substr(gen_random_uuid()::text,1,8) || '@example.invalid',
          'DB02 Faculty A')
  RETURNING id INTO user_faculty_a;

  INSERT INTO users(identity_uid, email, display_name)
  VALUES ('db02-fac-b-' || gen_random_uuid()::text,
          'db02-fac-b-' || substr(gen_random_uuid()::text,1,8) || '@example.invalid',
          'DB02 Faculty B')
  RETURNING id INTO user_faculty_b;

  INSERT INTO college_memberships(user_id, college_id)
  VALUES (user_faculty_a, college_a) RETURNING id INTO faculty_membership_a;
  INSERT INTO college_memberships(user_id, college_id)
  VALUES (user_faculty_b, college_b) RETURNING id INTO faculty_membership_b;

  INSERT INTO membership_roles(membership_id, role)
  VALUES (faculty_membership_a, 'FACULTY');
  INSERT INTO membership_roles(membership_id, role)
  VALUES (faculty_membership_b, 'FACULTY');

  INSERT INTO lecture_halls(college_id, department_id, name, capacity, room_type)
  VALUES (college_a, dept_a, 'DB02 Hall A', 120, 'LECTURE_HALL')
  RETURNING id INTO hall_a;

  -- -------------------------------------------------------------------------
  -- Stable tenant ownership + cohort/section period scope
  -- -------------------------------------------------------------------------
  failed := false;
  BEGIN
    UPDATE departments SET college_id = college_b WHERE id = dept_a;
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'department cross-college move was accepted';
  END IF;

  failed := false;
  BEGIN
    UPDATE programs SET department_id = dept_b WHERE id = program_a;
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'program cross-college department move was accepted';
  END IF;

  failed := false;
  BEGIN
    UPDATE courses SET department_id = dept_b WHERE id = course_core_a;
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'course cross-college department move was accepted';
  END IF;

  failed := false;
  BEGIN
    INSERT INTO cohorts(
      program_id, name, code, start_period_id, expected_end_period_id, status,
      start_date, end_date
    ) VALUES (
      program_a, 'Bad cross-college cohort', 'DB02-BAD-C', period_b, period_b, 'ACTIVE',
      period_start, period_end
    );
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'cross-college cohort period was accepted';
  END IF;

  failed := false;
  BEGIN
    INSERT INTO sections(
      cohort_id, academic_period_id, name, code, capacity, minimum_capacity
    ) VALUES (
      cohort_a, period_b, 'Bad cross-college section', 'DB02-BAD-S', 30, 0
    );
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'cross-college section period was accepted';
  END IF;

  -- -------------------------------------------------------------------------
  -- Program term / curriculum invariants
  -- -------------------------------------------------------------------------
  failed := false;
  BEGIN
    INSERT INTO program_term_courses(program_term_id, course_id, type, credits, display_order)
    VALUES (term_a1, course_b, 'CORE', 3, 2);
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'cross-college program-term course link was accepted';
  END IF;

  failed := false;
  BEGIN
    INSERT INTO course_offerings(course_id, cohort_id, academic_period_id, program_term_id,
                                 type, credits, display_order)
    VALUES (course_elective_a, cohort_a, period_a, term_a1, 'CORE', 3, 2);
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'CORE offering outside program-term curriculum was accepted';
  END IF;

  -- ELECTIVE is term-bound but need not be in fixed curriculum.
  INSERT INTO course_offerings(course_id, cohort_id, academic_period_id, program_term_id,
                               type, credits, display_order)
  VALUES (course_elective_a, cohort_a, period_a, term_a1, 'ELECTIVE', 3, 2)
  RETURNING id INTO elective_offering_a;

  -- Delivery must inherit exactly the offering's cohort/period through its section.
  failed := false;
  BEGIN
    INSERT INTO course_section_deliveries(offering_id, section_id)
    VALUES (elective_offering_a, section_b);
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'cross-cohort/period course delivery was accepted';
  END IF;

  INSERT INTO course_section_deliveries(offering_id, section_id)
  VALUES (elective_offering_a, section_a)
  RETURNING id INTO delivery_a;

  INSERT INTO section_schedule_events(section_id, title, starts_at, ends_at)
  VALUES (
    section_b, 'DB02 Section B event',
    date_trunc('day', now()) + interval '9 days 09 hours',
    date_trunc('day', now()) + interval '9 days 10 hours'
  ) RETURNING id INTO event_section_b;

  failed := false;
  BEGIN
    INSERT INTO section_schedule_event_courses(schedule_event_id, delivery_id)
    VALUES (event_section_b, delivery_a);
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'schedule event accepted delivery from another section';
  END IF;

  failed := false;
  BEGIN
    INSERT INTO course_offerings(course_id, cohort_id, academic_period_id, program_term_id,
                                 type, credits, display_order)
    VALUES (course_core_a, cohort_a, period_b, term_a1, 'CORE', 4, 1);
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'cross-college offering period was accepted';
  END IF;

  failed := false;
  BEGIN
    INSERT INTO course_offerings(course_id, cohort_id, academic_period_id, program_term_id,
                                 type, credits, display_order)
    VALUES (course_elective_a, cohort_a, period_a_outside, term_a1, 'ELECTIVE', 3, 3);
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'same-college offering outside cohort period window was accepted';
  END IF;

  -- Duration cannot shrink below configured terms.
  failed := false;
  BEGIN
    UPDATE programs SET duration_terms = 1 WHERE id = program_a;
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'program duration shrink below configured term was accepted';
  END IF;

  -- -------------------------------------------------------------------------
  -- Cohort/class compatibility state
  -- -------------------------------------------------------------------------
  failed := false;
  BEGIN
    UPDATE sections SET minimum_capacity = 61 WHERE id = section_a;
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'section minimum_capacity > capacity was accepted';
  END IF;

  failed := false;
  BEGIN
    UPDATE sections
       SET start_date = DATE '2026-12-31',
           end_date = DATE '2026-07-01'
     WHERE id = section_a;
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'reversed section lifecycle dates were accepted';
  END IF;

  -- -------------------------------------------------------------------------
  -- Cohort progression monotonicity + database-owned history
  -- -------------------------------------------------------------------------
  UPDATE cohort_progression_state
     SET current_term_number = 2,
         current_academic_year_start = 2026,
         current_period_id = period_a,
         version = 1
   WHERE cohort_id = cohort_a
     AND version = 0;

  SELECT current_term_number, version
    INTO progression_term, progression_version
    FROM cohort_progression_state
   WHERE cohort_id = cohort_a;

  IF progression_term <> 2 OR progression_version <> 1 THEN
    RAISE EXCEPTION 'valid progression update did not persist expected state';
  END IF;

  SELECT count(*) INTO event_count
    FROM cohort_progression_events
   WHERE cohort_id = cohort_a AND state_version = 1;

  IF event_count <> 1 THEN
    RAISE EXCEPTION 'expected exactly one progression event, found %', event_count;
  END IF;

  failed := false;
  BEGIN
    UPDATE cohort_progression_state
       SET current_term_number = 4,
           version = 2
     WHERE cohort_id = cohort_a;
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'term jump was accepted';
  END IF;

  failed := false;
  BEGIN
    UPDATE cohort_progression_state
       SET current_term_number = 3,
           current_period_id = period_b,
           version = 2
     WHERE cohort_id = cohort_a;
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'cross-college progression period was accepted';
  END IF;

  failed := false;
  BEGIN
    UPDATE cohort_progression_state
       SET current_term_number = 3,
           current_period_id = period_a_outside,
           version = 2
     WHERE cohort_id = cohort_a;
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'progression outside cohort period window was accepted';
  END IF;

  failed := false;
  BEGIN
    INSERT INTO cohort_progression_events(
      cohort_id, from_term_number, to_term_number, state_version
    ) VALUES (cohort_a, 2, 3, 2);
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'direct progression event INSERT was accepted';
  END IF;

  failed := false;
  BEGIN
    DELETE FROM cohort_progression_events
     WHERE cohort_id = cohort_a;
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'direct progression event DELETE was accepted';
  END IF;

  -- -------------------------------------------------------------------------
  -- Broad faculty-course association invariants
  -- -------------------------------------------------------------------------
  INSERT INTO faculty_course_associations(membership_id, course_id)
  VALUES (faculty_membership_a, course_core_a)
  RETURNING id INTO assoc_a;

  INSERT INTO course_teaching_assignments(delivery_id, membership_id, role)
  VALUES (delivery_a, faculty_membership_a, 'PRIMARY')
  RETURNING id INTO teaching_a;

  INSERT INTO section_faculty_assignments(section_id, membership_id, role)
  VALUES (section_a, faculty_membership_a, 'ADVISOR')
  RETURNING id INTO section_faculty_a;

  failed := false;
  BEGIN
    INSERT INTO section_faculty_assignments(section_id, membership_id, role)
    VALUES (section_a, faculty_membership_b, 'COORDINATOR');
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'cross-college section faculty assignment was accepted';
  END IF;

  failed := false;
  BEGIN
    INSERT INTO course_teaching_assignments(delivery_id, membership_id, role)
    VALUES (delivery_a, faculty_membership_b, 'CO_TEACHER');
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'cross-college course teaching assignment was accepted';
  END IF;

  failed := false;
  BEGIN
    INSERT INTO faculty_course_associations(membership_id, course_id)
    VALUES (faculty_membership_a, course_core_a);
  EXCEPTION WHEN unique_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'duplicate active faculty-course association was accepted';
  END IF;

  failed := false;
  BEGIN
    INSERT INTO faculty_course_associations(membership_id, course_id)
    VALUES (faculty_membership_b, course_core_a);
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'cross-college faculty-course association was accepted';
  END IF;

  INSERT INTO section_schedule_events(
    section_id, faculty_membership_id, title, starts_at, ends_at
  ) VALUES (
    section_a, faculty_membership_a, 'DB02 de-role future event',
    date_trunc('day', now()) + interval '5 days 09 hours',
    date_trunc('day', now()) + interval '5 days 10 hours'
  ) RETURNING id INTO lifecycle_event;

  DELETE FROM membership_roles
   WHERE membership_id = faculty_membership_a
     AND role = 'FACULTY';

  SELECT ended_at INTO ended_at_seen
    FROM faculty_course_associations
   WHERE id = assoc_a;

  IF ended_at_seen IS NULL THEN
    RAISE EXCEPTION 'FACULTY role removal did not close active association';
  END IF;

  SELECT ended_at INTO ended_at_seen
    FROM course_teaching_assignments
   WHERE id = teaching_a;
  IF ended_at_seen IS NULL THEN
    RAISE EXCEPTION 'FACULTY role removal did not close active course teaching assignment';
  END IF;

  SELECT ended_at INTO ended_at_seen
    FROM section_faculty_assignments
   WHERE id = section_faculty_a;
  IF ended_at_seen IS NULL THEN
    RAISE EXCEPTION 'FACULTY role removal did not close active section faculty assignment';
  END IF;

  IF EXISTS (
    SELECT 1 FROM section_schedule_events
     WHERE id = lifecycle_event
       AND faculty_membership_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'FACULTY role removal did not unassign future scheduled event';
  END IF;

  INSERT INTO membership_roles(membership_id, role)
  VALUES (faculty_membership_a, 'FACULTY');

  -- Re-adding FACULTY must not reopen history; new active rows are explicit.
  INSERT INTO faculty_course_associations(membership_id, course_id)
  VALUES (faculty_membership_a, course_core_a)
  RETURNING id INTO assoc_a;

  INSERT INTO course_teaching_assignments(delivery_id, membership_id, role)
  VALUES (delivery_a, faculty_membership_a, 'PRIMARY')
  RETURNING id INTO teaching_a;

  INSERT INTO section_faculty_assignments(section_id, membership_id, role)
  VALUES (section_a, faculty_membership_a, 'ADVISOR')
  RETURNING id INTO section_faculty_a;

  INSERT INTO section_schedule_events(
    section_id, faculty_membership_id, title, starts_at, ends_at
  ) VALUES (
    section_a, faculty_membership_a, 'DB02 suspension future event',
    date_trunc('day', now()) + interval '6 days 09 hours',
    date_trunc('day', now()) + interval '6 days 10 hours'
  ) RETURNING id INTO lifecycle_event;

  UPDATE college_memberships
     SET status = 'SUSPENDED',
         suspended_at = now(),
         suspension_reason = 'DB02 acceptance'
   WHERE id = faculty_membership_a;

  SELECT ended_at INTO ended_at_seen
    FROM faculty_course_associations
   WHERE id = assoc_a;

  IF ended_at_seen IS NULL THEN
    RAISE EXCEPTION 'membership suspension did not close active association';
  END IF;

  SELECT ended_at INTO ended_at_seen
    FROM course_teaching_assignments
   WHERE id = teaching_a;
  IF ended_at_seen IS NULL THEN
    RAISE EXCEPTION 'membership suspension did not close active course teaching assignment';
  END IF;

  SELECT ended_at INTO ended_at_seen
    FROM section_faculty_assignments
   WHERE id = section_faculty_a;
  IF ended_at_seen IS NULL THEN
    RAISE EXCEPTION 'membership suspension did not close active section faculty assignment';
  END IF;

  IF EXISTS (
    SELECT 1 FROM section_schedule_events
     WHERE id = lifecycle_event
       AND faculty_membership_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'membership suspension did not unassign future scheduled event';
  END IF;

  UPDATE college_memberships
     SET status = 'ACTIVE',
         suspended_at = NULL,
         suspension_reason = NULL
   WHERE id = faculty_membership_a;

  -- -------------------------------------------------------------------------
  -- Lecture hall tenant + scheduling overlap/cancellation/archive behavior
  -- -------------------------------------------------------------------------
  failed := false;
  BEGIN
    INSERT INTO section_schedule_events(
      section_id, faculty_membership_id, lecture_hall_id, title, starts_at, ends_at
    ) VALUES (
      section_a, faculty_membership_b, hall_a, 'Cross tenant faculty',
      slot_a_start,
      slot_a_end
    );
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'cross-college scheduled faculty was accepted';
  END IF;

  INSERT INTO section_schedule_events(
    section_id, faculty_membership_id, lecture_hall_id, title, starts_at, ends_at
  ) VALUES (
    section_a, faculty_membership_a, hall_a, 'DB02 Event A',
    slot_a_start,
    slot_a_end
  ) RETURNING id INTO event_a;

  failed := false;
  BEGIN
    INSERT INTO section_schedule_events(
      section_id, faculty_membership_id, lecture_hall_id, title, starts_at, ends_at
    ) VALUES (
      section_a, faculty_membership_a, hall_a, 'DB02 overlapping event',
      slot_overlap_start,
      slot_overlap_end
    );
  EXCEPTION WHEN exclusion_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'overlapping scheduled resource was accepted';
  END IF;

  -- Back-to-back [start,end) is valid.
  INSERT INTO section_schedule_events(
    section_id, faculty_membership_id, lecture_hall_id, title, starts_at, ends_at
  ) VALUES (
    section_a, faculty_membership_a, hall_a, 'DB02 Event B',
    slot_a_end,
    slot_b_end
  ) RETURNING id INTO event_b;

  UPDATE section_schedule_events
     SET status = 'CANCELLED'
   WHERE id = event_a;

  -- Cancellation releases the same timeslot.
  INSERT INTO section_schedule_events(
    section_id, faculty_membership_id, lecture_hall_id, title, starts_at, ends_at
  ) VALUES (
    section_a, faculty_membership_a, hall_a, 'DB02 replacement event',
    slot_a_start,
    slot_a_end
  );

  failed := false;
  BEGIN
    UPDATE lecture_halls SET status = 'ARCHIVED' WHERE id = hall_a;
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'hall with future scheduled sessions was archived';
  END IF;

  UPDATE section_schedule_events
     SET status = 'CANCELLED'
   WHERE lecture_hall_id = hall_a
     AND status = 'SCHEDULED';

  UPDATE lecture_halls SET status = 'ARCHIVED' WHERE id = hall_a;

  -- Archived hall cannot receive a new active booking.
  failed := false;
  BEGIN
    INSERT INTO section_schedule_events(
      section_id, faculty_membership_id, lecture_hall_id, title, starts_at, ends_at
    ) VALUES (
      section_a, faculty_membership_a, hall_a, 'Archived hall booking',
      slot_archived_start,
      slot_archived_end
    );
  EXCEPTION WHEN foreign_key_violation OR check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'booking against archived hall was accepted';
  END IF;

  RAISE NOTICE 'DB02 single-session acceptance PASS';
END;
$db02_accept$;

ROLLBACK;
