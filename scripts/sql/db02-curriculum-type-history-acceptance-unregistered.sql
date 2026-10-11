-- DB02/DB-005 curriculum type historical identity acceptance, UNREGISTERED.
-- Run only on a DISPOSABLE PostgreSQL DB AFTER Chat 1 integrates canonical DB02
-- and db02-curriculum-type-history-guard.draft.sql. ROLLBACK all fixture data.
-- No runtime execution is claimed by the author.
BEGIN;

DO $db02_curriculum_type$
DECLARE
  v_org uuid;
  v_college uuid;
  v_dept uuid;
  v_program uuid;
  v_period uuid;
  v_cohort uuid;
  v_term uuid;
  v_course uuid;
  v_unused_course uuid;
  v_mapping uuid;
  v_unused_mapping uuid;
  v_offering uuid;
  v_rejected boolean := false;
  v_credits integer;
  v_order integer;
  v_type course_offering_type;
BEGIN
  INSERT INTO organizations(name)
  VALUES('DB02 curriculum type acceptance org') RETURNING id INTO v_org;
  INSERT INTO colleges(organization_id,name,code)
  VALUES(v_org,'DB02 curriculum type acceptance college',
        'DB02-TYPE-' || substr(gen_random_uuid()::text,1,8))
  RETURNING id INTO v_college;
  INSERT INTO departments(college_id,name)
  VALUES(v_college,'DB02 type acceptance dept')
  RETURNING id INTO v_dept;
  INSERT INTO programs(department_id,name,code,duration_terms)
  VALUES(v_dept,'DB02 type acceptance program',
        'DB02-TYPE-PROG-' || substr(gen_random_uuid()::text,1,8),4)
  RETURNING id INTO v_program;
  INSERT INTO academic_periods(college_id,name,code,start_date,end_date,status)
  VALUES(v_college,'DB02 type acceptance period',
        'DB02-TYPE-PER-' || substr(gen_random_uuid()::text,1,8),
        current_date-30,current_date+365,'ACTIVE')
  RETURNING id INTO v_period;
  INSERT INTO cohorts(program_id,name,code,start_period_id,expected_end_period_id,status)
  VALUES(v_program,'DB02 type acceptance cohort',
        'DB02-TYPE-COH-' || substr(gen_random_uuid()::text,1,8),
        v_period,v_period,'ACTIVE')
  RETURNING id INTO v_cohort;
  INSERT INTO program_terms(program_id,term_number,name,is_active)
  VALUES(v_program,1,'Semester 1',true)
  RETURNING id INTO v_term;
  INSERT INTO courses(department_id,name,code)
  VALUES(v_dept,'DB02 type primary course',
        'DB02-TYPE-CRS-' || substr(gen_random_uuid()::text,1,8))
  RETURNING id INTO v_course;
  INSERT INTO courses(department_id,name,code)
  VALUES(v_dept,'DB02 type unused course',
        'DB02-TYPE-UNUSED-' || substr(gen_random_uuid()::text,1,8))
  RETURNING id INTO v_unused_course;
  INSERT INTO program_term_courses(program_term_id,course_id,type,credits,display_order)
  VALUES(v_term,v_course,'CORE',0,1)
  RETURNING id INTO v_mapping;
  INSERT INTO program_term_courses(program_term_id,course_id,type,credits,display_order)
  VALUES(v_term,v_unused_course,'CORE',0,2)
  RETURNING id INTO v_unused_mapping;

  -- Before historical use, the program's curriculum type may be edited.
  UPDATE program_term_courses SET type='ELECTIVE' WHERE id=v_unused_mapping;
  UPDATE program_term_courses SET type='CORE' WHERE id=v_unused_mapping;

  -- The core offering is backed by the fixed curriculum-row FK.
  INSERT INTO course_offerings(
    course_id,cohort_id,academic_period_id,program_term_id,
    program_term_course_id,type,credits,display_order
  ) VALUES(
    v_course,v_cohort,v_period,v_term,v_mapping,'CORE',0,1
  ) RETURNING id INTO v_offering;

  -- Editing unrelated curriculum fields must stay possible.
  UPDATE program_term_courses
     SET credits=3,display_order=3
   WHERE id=v_mapping;

  SELECT credits,display_order,type
    INTO v_credits,v_order,v_type
    FROM program_term_courses WHERE id=v_mapping;

  IF v_credits<>3 OR v_order<>3 OR v_type<>'CORE' THEN
    RAISE EXCEPTION 'Legacy-supported curriculum metadata edits were rejected';
  END IF;

  -- Regression: this UPDATE previously passed because the canonical guard
  -- fired when offering was inserted, not when its parent curriculum type changed.
  BEGIN
    UPDATE program_term_courses SET type='ELECTIVE' WHERE id=v_mapping;
  EXCEPTION WHEN check_violation THEN
    v_rejected := true;
  END;

  IF NOT v_rejected THEN
    RAISE EXCEPTION 'History-backed CORE curriculum was changed to ELECTIVE';
  END IF;

  -- The previous exception rolls back only the nested UPDATE, not the offering.
  IF NOT EXISTS (
    SELECT 1
      FROM course_offerings co
      JOIN program_term_courses ptc ON ptc.id=co.program_term_course_id
     WHERE co.id=v_offering
       AND co.type='CORE'
       AND ptc.type='CORE'
  ) THEN
    RAISE EXCEPTION 'CORE offering historical curriculum association corrupted';
  END IF;

  -- Even an inactive/cancelled offering must retain its historical CORE identity.
  UPDATE course_offerings SET status='ARCHIVED' WHERE id=v_offering;

  v_rejected := false;
  BEGIN
    UPDATE program_term_courses SET type='ELECTIVE' WHERE id=v_mapping;
  EXCEPTION WHEN check_violation THEN
    v_rejected := true;
  END;

  IF NOT v_rejected THEN
    RAISE EXCEPTION 'Inactive historical CORE offering lost fixed curriculum type';
  END IF;

  RAISE NOTICE 'DB02 curriculum type history PASS';
END;
$db02_curriculum_type$;
ROLLBACK;
