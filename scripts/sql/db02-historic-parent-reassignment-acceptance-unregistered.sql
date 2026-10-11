-- DB02 history-parent acceptance. UNEXECUTED and UNREGISTERED.
-- Run only on a disposable PostgreSQL database AFTER Chat 1 registers the
-- reviewed single consolidated canonical DB02 stage.
-- All fixture rows are rolled back even on successful acceptance.
BEGIN;
DO $db02_history_accept$
DECLARE
  v_org uuid;
  v_college uuid;
  v_department uuid;
  v_program uuid;
  v_period uuid;
  v_cohort uuid;
  v_term uuid;
  v_term_course_a uuid;
  v_term_course_b uuid;
  v_course_a uuid;
  v_course_b uuid;
  v_section_a uuid;
  v_section_b uuid;
  v_offering uuid;
  v_delivery uuid;
  v_event_linked uuid;
  v_event_attendance uuid;
  v_failed boolean;
  v_events integer;
BEGIN
  INSERT INTO organizations(name) VALUES ('DB02 history acceptance org')
  RETURNING id INTO v_org;
  INSERT INTO colleges(organization_id,name,code)
  VALUES (v_org,'DB02 history acceptance college','HISTORY-' || substr(gen_random_uuid()::text,1,8))
  RETURNING id INTO v_college;
  INSERT INTO departments(college_id,name)
  VALUES (v_college,'DB02 history acceptance department')
  RETURNING id INTO v_department;
  INSERT INTO programs(department_id,name,code,duration_terms)
  VALUES (v_department,'DB02 history program','HISTORY-' || substr(gen_random_uuid()::text,1,8),4)
  RETURNING id INTO v_program;
  INSERT INTO academic_periods(college_id,name,code,start_date,end_date,status)
  VALUES (v_college,'DB02 history period','HISTORY-' || substr(gen_random_uuid()::text,1,8),
          current_date - 30,current_date + 365,'ACTIVE')
  RETURNING id INTO v_period;
  INSERT INTO courses(department_id,name,code)
  VALUES (v_department,'DB02 History Core A','HIST-A-' || substr(gen_random_uuid()::text,1,8))
  RETURNING id INTO v_course_a;
  INSERT INTO courses(department_id,name,code)
  VALUES (v_department,'DB02 History Core B','HIST-B-' || substr(gen_random_uuid()::text,1,8))
  RETURNING id INTO v_course_b;
  INSERT INTO program_terms(program_id,term_number,name,is_active)
  VALUES (v_program,1,'History Term 1',true)
  RETURNING id INTO v_term;
  INSERT INTO program_term_courses(program_term_id,course_id,type,credits,display_order)
  VALUES(v_term,v_course_a,'CORE',0,1)
  RETURNING id INTO v_term_course_a;
  INSERT INTO program_term_courses(program_term_id,course_id,type,credits,display_order)
  VALUES(v_term,v_course_b,'CORE',0,2)
  RETURNING id INTO v_term_course_b;
  INSERT INTO cohorts(program_id,name,code,start_period_id,expected_end_period_id,status)
  VALUES (v_program,'DB02 History Cohort','HISTORY-' || substr(gen_random_uuid()::text,1,8),
          v_period,v_period,'ACTIVE')
  RETURNING id INTO v_cohort;
  INSERT INTO sections(cohort_id,academic_period_id,name,code,capacity)
  VALUES(v_cohort,v_period,'History Section A','HISTORY-A-' || substr(gen_random_uuid()::text,1,8),30)
  RETURNING id INTO v_section_a;
  INSERT INTO sections(cohort_id,academic_period_id,name,code,capacity)
  VALUES(v_cohort,v_period,'History Section B','HISTORY-B-' || substr(gen_random_uuid()::text,1,8),30)
  RETURNING id INTO v_section_b;
  INSERT INTO course_offerings(
    course_id,cohort_id,academic_period_id,program_term_id,program_term_course_id,
    type,credits,display_order
  ) VALUES(v_course_a,v_cohort,v_period,v_term,v_term_course_a,'CORE',0,1)
  RETURNING id INTO v_offering;
  INSERT INTO course_section_deliveries(offering_id,section_id)
  VALUES(v_offering,v_section_a)
  RETURNING id INTO v_delivery;
  INSERT INTO section_schedule_events(section_id,title,starts_at,ends_at)
  VALUES(v_section_a,'History linked lecture',
         statement_timestamp() + interval '7 days',
         statement_timestamp() + interval '7 days 1 hour')
  RETURNING id INTO v_event_linked;
  INSERT INTO section_schedule_event_courses(schedule_event_id,delivery_id)
  VALUES(v_event_linked,v_delivery);

  -- Both CORE courses are valid curriculum members. This is specifically
  -- a forbidden historic rewrite, NOT an unrelated curriculum check failure.
  v_failed := false;
  BEGIN
    UPDATE course_offerings
       SET course_id=v_course_b,
           program_term_course_id=v_term_course_b
     WHERE id=v_offering;
  EXCEPTION WHEN check_violation THEN
    v_failed := true;
  END;
  IF NOT v_failed THEN
    RAISE EXCEPTION 'History-backed offering course identity was rewritten';
  END IF;

  -- Section B shares tenant, cohort and period with section A, so other
  -- scopes do not mask the history-parent identity violation.
  v_failed := false;
  BEGIN
    UPDATE course_section_deliveries SET section_id=v_section_b WHERE id=v_delivery;
  EXCEPTION WHEN check_violation THEN
    v_failed := true;
  END;
  IF NOT v_failed THEN
    RAISE EXCEPTION 'Historical delivery section identity was rewritten';
  END IF;

  v_failed := false;
  BEGIN
    UPDATE section_schedule_events SET section_id=v_section_b WHERE id=v_event_linked;
  EXCEPTION WHEN check_violation THEN
    v_failed := true;
  END;
  IF NOT v_failed THEN
    RAISE EXCEPTION 'Delivery-linked event section identity was rewritten';
  END IF;

  INSERT INTO section_schedule_events(section_id,title,starts_at,ends_at)
  VALUES(v_section_a,'Attendance-only lecture',
         statement_timestamp() + interval '9 days',
         statement_timestamp() + interval '9 days 1 hour')
  RETURNING id INTO v_event_attendance;

  INSERT INTO attendance_sessions(schedule_event_id,status)
  VALUES(v_event_attendance,'UNMARKED');
  v_failed := false;
  BEGIN
    UPDATE section_schedule_events
       SET section_id=v_section_b
     WHERE id=v_event_attendance;
  EXCEPTION WHEN check_violation THEN
    v_failed := true;
  END;
  IF NOT v_failed THEN
    RAISE EXCEPTION 'Attendance-linked event section identity was rewritten';
  END IF;

  SELECT COUNT(*) INTO v_events
  FROM section_schedule_event_courses WHERE schedule_event_id=v_event_linked
    AND delivery_id=v_delivery;
  IF v_events<>1 THEN
    RAISE EXCEPTION 'Linked teaching/event history was corrupted';
  END IF;
  RAISE NOTICE 'DB02 history-parent single-session acceptance PASS';
END;
$db02_history_accept$;
ROLLBACK;
