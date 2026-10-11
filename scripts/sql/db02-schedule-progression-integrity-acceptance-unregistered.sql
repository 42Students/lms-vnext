-- DB02 overlay regression acceptance; DO NOT run against production.
-- Requires a clean disposable PostgreSQL database where Chat 1 has registered
-- canonical DB02, parent/enrollment extension, and reviewed overlay.
-- Source-only authored acceptance: NOT EXECUTED. Rolls back ALL fixtures.
BEGIN;

DO $db02_overlay_accept$
DECLARE
  org_id uuid;
  college_id uuid;
  department_id uuid;
  program_id uuid;
  period_id uuid;
  cohort_id uuid;
  section_id uuid;
  hall_id uuid;
  event_id uuid;
  actor_id uuid;
  event_count integer;
  version_before bigint;
  year_before integer;
  term_before integer;
  tmp integer;
  failed boolean;
  previous_start timestamptz := statement_timestamp() - interval '7 days';
  previous_end timestamptz := statement_timestamp() - interval '7 days' + interval '1 hour';
  future_start timestamptz := statement_timestamp() + interval '7 days';
  future_end timestamptz := statement_timestamp() + interval '7 days 1 hour';
BEGIN
  INSERT INTO organizations(name) VALUES ('DB02 overlay acceptance org')
    RETURNING id INTO org_id;
  INSERT INTO colleges(organization_id, name, code)
  VALUES (org_id, 'DB02 overlay acceptance college', 'DB02-OVERLAY-' || substr(gen_random_uuid()::text,1,8))
    RETURNING id INTO college_id;
  INSERT INTO departments(college_id, name)
  VALUES (college_id, 'DB02 overlay acceptance department')
    RETURNING id INTO department_id;
  INSERT INTO programs(department_id, name, code, duration_terms)
  VALUES (department_id, 'DB02 overlay acceptance program', 'OVERLAY-' || substr(gen_random_uuid()::text,1,8), 4)
    RETURNING id INTO program_id;
  INSERT INTO academic_periods(college_id, name, code, start_date, end_date, status)
  VALUES (college_id, 'DB02 overlay acceptance period', 'OVERLAY-' || substr(gen_random_uuid()::text,1,8),
          current_date - 30, current_date + 365, 'ACTIVE')
    RETURNING id INTO period_id;
  INSERT INTO program_terms(program_id, term_number, name, is_active)
  VALUES (program_id, 1, 'Term 1', true);
  INSERT INTO cohorts(program_id, name, code, start_period_id, expected_end_period_id, status)
  VALUES (program_id, 'DB02 overlay cohort', 'OVERLAY-COH-' || substr(gen_random_uuid()::text,1,8),
          period_id, period_id, 'ACTIVE')
    RETURNING id INTO cohort_id;
  INSERT INTO sections(cohort_id, academic_period_id, name, code, capacity)
  VALUES (cohort_id, period_id, 'DB02 overlay section', 'OVERLAY-SEC-' || substr(gen_random_uuid()::text,1,8), 60)
    RETURNING id INTO section_id;
  INSERT INTO lecture_halls(college_id, department_id, name, capacity, room_type)
  VALUES (college_id, department_id, 'DB02 overlay hall', 100, 'CLASSROOM')
    RETURNING id INTO hall_id;

  -- A past completed timeslot must not prevent hall archival.
  INSERT INTO section_schedule_events(section_id, lecture_hall_id, title, starts_at, ends_at)
  VALUES (section_id, hall_id, 'DB02 historical event', previous_start, previous_end)
    RETURNING id INTO event_id;
  UPDATE lecture_halls SET status='ARCHIVED' WHERE id=hall_id;

  -- This is the specific bypass the canonical stage previously allowed:
  -- changing ONLY timestamps on a historical SCHEDULED event.
  failed := false;
  BEGIN
    UPDATE section_schedule_events
       SET starts_at=future_start, ends_at=future_end
     WHERE id=event_id;
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'Timestamp-only UPDATE resurrected a scheduled booking in an archived hall';
  END IF;

  SELECT count(*) INTO tmp
  FROM section_schedule_events
  WHERE id=event_id AND starts_at=previous_start AND ends_at=previous_end;
  IF tmp <> 1 THEN
    RAISE EXCEPTION 'Failed booking mutation altered historical event';
  END IF;

  -- Explicit new booking against archived hall must also fail.
  failed := false;
  BEGIN
    INSERT INTO section_schedule_events(section_id, lecture_hall_id, title, starts_at, ends_at)
    VALUES(section_id, hall_id, 'DB02 forbidden future event', future_start, future_end);
  EXCEPTION WHEN check_violation OR foreign_key_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'Direct future booking against archived hall succeeded';
  END IF;

  -- Exact identity cannot migrate silently across cohorts.
  failed := false;
  BEGIN
    UPDATE cohort_progression_state SET cohort_id=gen_random_uuid()
    WHERE cohort_id=cohort_id;
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'Canonical cohort progression identity is mutable';
  END IF;

  failed := false;
  BEGIN
    DELETE FROM cohort_progression_state WHERE cohort_id=cohort_id;
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'Canonical progression state could be deleted';
  END IF;

  failed := false;
  BEGIN
    TRUNCATE cohort_progression_state;
  EXCEPTION WHEN check_violation THEN
    failed := true;
  END;
  IF NOT failed THEN
    RAISE EXCEPTION 'Canonical progression state could be truncated';
  END IF;

  -- Audit actor may be deleted without losing the academic event, advancing
  -- a term, incrementing version, or creating a phantom correction.
  INSERT INTO users(identity_uid, email, display_name)
  VALUES ('db02-overlay-' || gen_random_uuid()::text,
          'db02-overlay-' || substr(gen_random_uuid()::text,1,8) || '@example.invalid',
          'DB02 overlay audit actor') RETURNING id INTO actor_id;
  UPDATE cohort_progression_state
     SET current_academic_year_start=current_academic_year_start + 1,
         version=version + 1,
         updated_by_user_id=actor_id
   WHERE cohort_id=cohort_id;

  SELECT current_term_number, current_academic_year_start, version
  INTO term_before, year_before, version_before
  FROM cohort_progression_state WHERE cohort_id=cohort_id;
  SELECT count(*) INTO event_count FROM cohort_progression_events
  WHERE cohort_id=cohort_id;
  IF event_count <> 1 OR version_before <> 1 OR term_before <> 1 THEN
    RAISE EXCEPTION 'Precondition correction/history event missing';
  END IF;

  DELETE FROM users WHERE id=actor_id;

  IF NOT EXISTS (
    SELECT 1 FROM cohort_progression_state
    WHERE cohort_id=cohort_id
      AND updated_by_user_id IS NULL
      AND current_term_number=term_before
      AND current_academic_year_start=year_before
      AND version=version_before
  ) THEN
    RAISE EXCEPTION 'Audit actor cleanup mutated progression state';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM cohort_progression_events
    WHERE cohort_id=cohort_id AND state_version=version_before AND actor_user_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Audit actor cleanup did not preserve anonymized history';
  END IF;
  SELECT count(*) INTO tmp FROM cohort_progression_events WHERE cohort_id=cohort_id;
  IF tmp<>event_count THEN
    RAISE EXCEPTION 'Audit actor cleanup forged an academic event';
  END IF;

  RAISE NOTICE 'DB02 integrity overlay acceptance PASS';
END;
$db02_overlay_accept$;

ROLLBACK;
