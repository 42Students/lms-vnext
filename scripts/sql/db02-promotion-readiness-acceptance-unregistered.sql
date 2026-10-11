-- DB02 / DB-005 promotion readiness acceptance — UNREGISTERED, UNEXECUTED.
-- ONLY on disposable PostgreSQL AFTER numbered DB02 integration (canonical + proposed
-- db02-academic-progression-and-rooms-staging.sql); rolls back all fixture data.
-- Expected: one NOTICE "DB02 promotion readiness PASS" after 4 denied transitions,
-- an approved promotion and matching history, and one rejected further advance.
BEGIN;

DO $db02_promotion_accept$
DECLARE
  v_org uuid;
  v_college uuid;
  v_dept uuid;
  v_program uuid;
  v_period uuid;
  v_cohort uuid;
  v_term2 uuid;
  v_unused_term uuid;
  v_course uuid;
  v_event_count integer;
  v_term integer;
  v_version bigint;
  v_rejected boolean;
BEGIN
  INSERT INTO organizations(name)
  VALUES ('DB02 promotion readiness acceptance org')
  RETURNING id INTO v_org;

  INSERT INTO colleges(organization_id, name, code)
  VALUES (v_org, 'DB02 promotion readiness college',
          'DB02-PROM-' || substr(gen_random_uuid()::text,1,8))
  RETURNING id INTO v_college;

  INSERT INTO departments(college_id, name)
  VALUES (v_college, 'DB02 promotion readiness department')
  RETURNING id INTO v_dept;

  INSERT INTO programs(department_id,name,code,duration_terms)
  VALUES (v_dept, 'DB02 promotion readiness program',
          'DB02-PROG-' || substr(gen_random_uuid()::text,1,8), 4)
  RETURNING id INTO v_program;

  INSERT INTO academic_periods(college_id,name,code,start_date,end_date,status)
  VALUES (v_college, 'DB02 promotion readiness period',
          'DB02-PER-' || substr(gen_random_uuid()::text,1,8),
          current_date - 10, current_date + 365, 'ACTIVE')
  RETURNING id INTO v_period;

  INSERT INTO cohorts(program_id,name,code,start_period_id,expected_end_period_id,status)
  VALUES (v_program, 'DB02 promotion readiness cohort',
          'DB02-COH-' || substr(gen_random_uuid()::text,1,8),
          v_period, v_period, 'ACTIVE')
  RETURNING id INTO v_cohort;

  SELECT current_term_number, version INTO v_term,v_version
  FROM cohort_progression_state WHERE cohort_id=v_cohort;
  IF v_term<>1 OR v_version<>0 THEN
    RAISE EXCEPTION 'cohort did not initialize at term 1/version 0';
  END IF;

  -- Legacy explicitly forbids promotion when semester 2 does not exist.
  v_rejected := false;
  BEGIN
    UPDATE cohort_progression_state
       SET current_term_number=2, version=1
     WHERE cohort_id=v_cohort;
  EXCEPTION WHEN check_violation THEN
    v_rejected := true;
  END;
  IF NOT v_rejected THEN
    RAISE EXCEPTION 'promotion succeeded without configured destination term';
  END IF;

  INSERT INTO program_terms(program_id,term_number,name,is_active)
  VALUES(v_program,2,'Second semester',false)
  RETURNING id INTO v_term2;

  -- Legacy rejects a configured but disabled semester.
  v_rejected := false;
  BEGIN
    UPDATE cohort_progression_state
       SET current_term_number=2, version=1
     WHERE cohort_id=v_cohort;
  EXCEPTION WHEN check_violation THEN
    v_rejected := true;
  END;
  IF NOT v_rejected THEN
    RAISE EXCEPTION 'promotion succeeded into inactive destination term';
  END IF;

  UPDATE program_terms SET is_active=true WHERE id=v_term2;

  -- Legacy also rejects a semester whose curriculum is not mapped.
  v_rejected := false;
  BEGIN
    UPDATE cohort_progression_state
       SET current_term_number=2, version=1
     WHERE cohort_id=v_cohort;
  EXCEPTION WHEN check_violation THEN
    v_rejected := true;
  END;
  IF NOT v_rejected THEN
    RAISE EXCEPTION 'promotion succeeded into empty destination curriculum';
  END IF;

  INSERT INTO courses(department_id,name,code)
  VALUES (v_dept,'DB02 promotion readiness course',
          'DB02-CRS-' || substr(gen_random_uuid()::text,1,8))
  RETURNING id INTO v_course;

  INSERT INTO program_term_courses(program_term_id,course_id,type,credits,display_order)
  VALUES(v_term2,v_course,'CORE',0,1);

  -- An INACTIVE cohort is still forbidden even when curriculum is ready.
  UPDATE cohorts SET status='INACTIVE' WHERE id=v_cohort;
  v_rejected := false;
  BEGIN
    UPDATE cohort_progression_state
       SET current_term_number=2, version=1
     WHERE cohort_id=v_cohort;
  EXCEPTION WHEN check_violation THEN
    v_rejected := true;
  END;
  IF NOT v_rejected THEN
    RAISE EXCEPTION 'inactive cohort was allowed to promote';
  END IF;

  UPDATE cohorts SET status='ACTIVE' WHERE id=v_cohort;

  -- All source-backed preconditions now hold: exactly one advancement.
  UPDATE cohort_progression_state
     SET current_term_number=2, version=1
   WHERE cohort_id=v_cohort AND version=0;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'valid promotion failed to update current state';
  END IF;

  SELECT current_term_number,version INTO v_term,v_version
    FROM cohort_progression_state WHERE cohort_id=v_cohort;
  SELECT COUNT(*) INTO v_event_count
    FROM cohort_progression_events WHERE cohort_id=v_cohort
      AND event_kind='PROMOTION' AND from_term_number=1
      AND to_term_number=2 AND state_version=1;

  IF v_term<>2 OR v_version<>1 OR v_event_count<>1 THEN
    RAISE EXCEPTION 'promotion did not persist canonical state and exact history';
  END IF;

  -- Legacy cleanup may remove course mappings, but vNext must not then erase the
  -- semester definition underneath current/immutable progression history.
  DELETE FROM program_term_courses WHERE program_term_id=v_term2;

  v_rejected := false;
  BEGIN
    DELETE FROM program_terms WHERE id=v_term2;
  EXCEPTION WHEN check_violation THEN
    v_rejected := true;
  END;
  IF NOT v_rejected THEN
    RAISE EXCEPTION 'program term referenced by progression history was deleted';
  END IF;

  -- An unused term with no curriculum/progression history remains deletable.
  INSERT INTO program_terms(program_id,term_number,name,is_active)
  VALUES(v_program,4,'Unused semester 4',true)
  RETURNING id INTO v_unused_term;
  DELETE FROM program_terms WHERE id=v_unused_term;
  IF EXISTS (SELECT 1 FROM program_terms WHERE id=v_unused_term) THEN
    RAISE EXCEPTION 'unused program term could not be deleted';
  END IF;

  -- Next semester 3 still absent. Previous successful promotion cannot be
  -- used to jump to term 3 without a new, active, mapped curriculum.
  v_rejected := false;
  BEGIN
    UPDATE cohort_progression_state
       SET current_term_number=3, version=2
     WHERE cohort_id=v_cohort;
  EXCEPTION WHEN check_violation THEN
    v_rejected := true;
  END;
  IF NOT v_rejected THEN
    RAISE EXCEPTION 'promotion bypassed missing third term';
  END IF;

  SELECT COUNT(*) INTO v_event_count
    FROM cohort_progression_events WHERE cohort_id=v_cohort;
  IF v_event_count<>1 THEN
    RAISE EXCEPTION 'failed promotion appended an immutable history event';
  END IF;

  RAISE NOTICE 'DB02 promotion readiness PASS';
END;
$db02_promotion_accept$;

ROLLBACK;
