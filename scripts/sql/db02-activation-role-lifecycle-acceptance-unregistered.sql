-- DB02 / Chat 4 — rollback-only role-revocation/reactivation acceptance.
-- UNREGISTERED; use a disposable PostgreSQL database AFTER Chat 1 integrates
-- db02-activation-role-lifecycle-overlay.draft.sql with canonical DB02.
-- This script has not been executed; no production or shared DB usage.
BEGIN;
DO $db02_role_lifecycle$
DECLARE
  v_org uuid; v_college uuid; v_dept uuid; v_program uuid;
  v_period uuid; v_cohort uuid; v_section uuid; v_term uuid;
  v_course uuid; v_map uuid; v_offer uuid; v_delivery uuid;
  v_faculty_user uuid; v_learner_user uuid;
  v_faculty uuid; v_learner uuid;
  v_pool uuid; v_section_faculty uuid; v_teaching uuid;
  v_program_enroll uuid; v_section_enroll uuid;
  v_rejected boolean;
  v_count integer;
BEGIN
  INSERT INTO organizations(name) VALUES('DB02 role lifecycle org')
  RETURNING id INTO v_org;
  INSERT INTO colleges(organization_id,name,code)
  VALUES(v_org,'DB02 role lifecycle college','DB02-ROLE-' || substr(gen_random_uuid()::text,1,8))
  RETURNING id INTO v_college;
  INSERT INTO departments(college_id,name)
  VALUES(v_college,'DB02 role lifecycle department') RETURNING id INTO v_dept;
  INSERT INTO programs(department_id,name,code,duration_terms)
  VALUES(v_dept,'DB02 role lifecycle program',
    'DB02-ROLE-PROG-' || substr(gen_random_uuid()::text,1,8),4)
  RETURNING id INTO v_program;
  INSERT INTO academic_periods(college_id,name,code,start_date,end_date,status)
  VALUES(v_college,'DB02 role lifecycle period',
    'DB02-ROLE-PER-' || substr(gen_random_uuid()::text,1,8),
    current_date-30,current_date+365,'ACTIVE') RETURNING id INTO v_period;
  INSERT INTO cohorts(program_id,name,code,start_period_id,expected_end_period_id,status)
  VALUES(v_program,'DB02 role lifecycle cohort',
    'DB02-ROLE-COH-' || substr(gen_random_uuid()::text,1,8),
    v_period,v_period,'ACTIVE') RETURNING id INTO v_cohort;
  INSERT INTO sections(cohort_id,academic_period_id,name,code)
  VALUES(v_cohort,v_period,'DB02 role section',
    'DB02-ROLE-SEC-' || substr(gen_random_uuid()::text,1,8))
  RETURNING id INTO v_section;
  INSERT INTO program_terms(program_id,term_number,name,is_active)
  VALUES(v_program,1,'Term 1',true) RETURNING id INTO v_term;
  INSERT INTO courses(department_id,name,code)
  VALUES(v_dept,'DB02 role lifecycle course',
    'DB02-ROLE-CRS-' || substr(gen_random_uuid()::text,1,8))
  RETURNING id INTO v_course;
  INSERT INTO program_term_courses(program_term_id,course_id,type,credits,display_order)
  VALUES(v_term,v_course,'CORE',0,1) RETURNING id INTO v_map;
  INSERT INTO course_offerings(
    course_id,cohort_id,academic_period_id,program_term_id,program_term_course_id,
    type,credits,display_order
  ) VALUES(v_course,v_cohort,v_period,v_term,v_map,'CORE',0,1)
  RETURNING id INTO v_offer;
  INSERT INTO course_section_deliveries(offering_id,section_id)
  VALUES(v_offer,v_section) RETURNING id INTO v_delivery;

  INSERT INTO users(identity_uid,email,display_name)
  VALUES('db02-role-faculty-'||gen_random_uuid()::text,
         'db02-role-faculty-'||substr(gen_random_uuid()::text,1,8)||'@example.invalid',
         'DB02 Role Faculty') RETURNING id INTO v_faculty_user;
  INSERT INTO users(identity_uid,email,display_name)
  VALUES('db02-role-learner-'||gen_random_uuid()::text,
         'db02-role-learner-'||substr(gen_random_uuid()::text,1,8)||'@example.invalid',
         'DB02 Role Learner') RETURNING id INTO v_learner_user;
  INSERT INTO college_memberships(user_id,college_id)
  VALUES(v_faculty_user,v_college) RETURNING id INTO v_faculty;
  INSERT INTO college_memberships(user_id,college_id)
  VALUES(v_learner_user,v_college) RETURNING id INTO v_learner;
  INSERT INTO membership_roles(membership_id,role)
  VALUES(v_faculty,'FACULTY'),(v_learner,'LEARNER');
  INSERT INTO faculty_course_associations(membership_id,course_id)
  VALUES(v_faculty,v_course) RETURNING id INTO v_pool;
  INSERT INTO section_faculty_assignments(section_id,membership_id,role)
  VALUES(v_section,v_faculty,'ADVISOR') RETURNING id INTO v_section_faculty;
  INSERT INTO course_teaching_assignments(delivery_id,membership_id,role)
  VALUES(v_delivery,v_faculty,'PRIMARY') RETURNING id INTO v_teaching;
  INSERT INTO learner_program_enrollments(membership_id,program_id,cohort_id)
  VALUES(v_learner,v_program,v_cohort) RETURNING id INTO v_program_enroll;
  INSERT INTO section_enrollments(learner_enrollment_id,section_id,academic_period_id)
  VALUES(v_program_enroll,v_section,v_period) RETURNING id INTO v_section_enroll;

  -- Role deletion safely closes all three faculty relationships; closures
  -- must never be rejected merely because the role was deleted.
  DELETE FROM membership_roles
   WHERE membership_id=v_faculty AND role='FACULTY';
  SELECT COUNT(*) INTO v_count
  FROM (
    SELECT ended_at FROM faculty_course_associations WHERE id=v_pool
    UNION ALL SELECT ended_at FROM section_faculty_assignments WHERE id=v_section_faculty
    UNION ALL SELECT ended_at FROM course_teaching_assignments WHERE id=v_teaching
  ) ended WHERE ended_at IS NOT NULL;
  IF v_count<>3 THEN
    RAISE EXCEPTION 'FACULTY role removal did not close all three associations';
  END IF;

  -- Each UPDATE of ended_at=NULL formerly bypassed INSERT/parent role checks.
  v_rejected := false;
  BEGIN
    UPDATE faculty_course_associations SET ended_at=NULL WHERE id=v_pool;
  EXCEPTION WHEN check_violation THEN v_rejected := true;
  END;
  IF NOT v_rejected THEN RAISE EXCEPTION 'revoked FACULTY reopened course pool'; END IF;

  v_rejected := false;
  BEGIN
    UPDATE section_faculty_assignments SET ended_at=NULL WHERE id=v_section_faculty;
  EXCEPTION WHEN check_violation THEN v_rejected := true;
  END;
  IF NOT v_rejected THEN RAISE EXCEPTION 'revoked FACULTY reopened section assignment'; END IF;

  v_rejected := false;
  BEGIN
    UPDATE course_teaching_assignments SET ended_at=NULL WHERE id=v_teaching;
  EXCEPTION WHEN check_violation THEN v_rejected := true;
  END;
  IF NOT v_rejected THEN RAISE EXCEPTION 'revoked FACULTY reopened teaching assignment'; END IF;

  -- An explicitly restored role and ACTIVE membership is a valid underlying
  -- permission; approval/audit of user-directed reactivation remains API work.
  INSERT INTO membership_roles(membership_id,role) VALUES(v_faculty,'FACULTY');
  UPDATE faculty_course_associations SET ended_at=NULL WHERE id=v_pool;
  UPDATE section_faculty_assignments SET ended_at=NULL WHERE id=v_section_faculty;
  UPDATE course_teaching_assignments SET ended_at=NULL WHERE id=v_teaching;

  UPDATE college_memberships SET status='ENDED' WHERE id=v_faculty;
  v_rejected := false;
  BEGIN
    UPDATE section_faculty_assignments
       SET ended_at=NULL WHERE id=v_section_faculty;
  EXCEPTION WHEN check_violation THEN v_rejected := true;
  END;
  -- Membership end itself closed all rows; the already-closed NULL assignment
  -- cannot reopen. Verify membership-end closure separately in any case.
  IF EXISTS(SELECT 1 FROM section_faculty_assignments
             WHERE id=v_section_faculty AND ended_at IS NULL) THEN
    RAISE EXCEPTION 'ENDED membership retained active faculty assignment';
  END IF;
  -- A removed learner role closes both program and section memberships.
  DELETE FROM membership_roles WHERE membership_id=v_learner AND role='LEARNER';
  IF NOT EXISTS (SELECT 1 FROM learner_program_enrollments
                  WHERE id=v_program_enroll AND status='WITHDRAWN')
     OR NOT EXISTS (SELECT 1 FROM section_enrollments
                    WHERE id=v_section_enroll AND status='WITHDRAWN') THEN
    RAISE EXCEPTION 'LEARNER role removal did not withdraw both memberships';
  END IF;

  v_rejected := false;
  BEGIN
    UPDATE learner_program_enrollments SET status='ACTIVE'
    WHERE id=v_program_enroll;
  EXCEPTION WHEN check_violation THEN v_rejected := true;
  END;
  IF NOT v_rejected THEN RAISE EXCEPTION 'revoked LEARNER reopened program'; END IF;

  v_rejected := false;
  BEGIN
    UPDATE section_enrollments SET status='ACTIVE',ended_at=NULL
    WHERE id=v_section_enroll;
  EXCEPTION WHEN check_violation THEN v_rejected := true;
  END;
  IF NOT v_rejected THEN RAISE EXCEPTION 'revoked LEARNER reopened section'; END IF;

  -- Restored user role permits explicit reactivation; then a direct parent
  -- COMPLETED transition must close child as COMPLETED (not WITHDRAWN).
  INSERT INTO membership_roles(membership_id,role) VALUES(v_learner,'LEARNER');
  UPDATE learner_program_enrollments
     SET status='ACTIVE', withdrawn_at=NULL WHERE id=v_program_enroll;
  UPDATE section_enrollments
     SET status='ACTIVE',ended_at=NULL WHERE id=v_section_enroll;
  UPDATE learner_program_enrollments
     SET status='COMPLETED',completed_at=statement_timestamp()
   WHERE id=v_program_enroll;
  IF NOT EXISTS (SELECT 1 FROM section_enrollments
                  WHERE id=v_section_enroll
                    AND status='COMPLETED' AND ended_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Completed program left live/withdrawn section history';
  END IF;

  UPDATE learner_program_enrollments
     SET status='ACTIVE',completed_at=NULL WHERE id=v_program_enroll;
  UPDATE section_enrollments
     SET status='ACTIVE',ended_at=NULL WHERE id=v_section_enroll;
  UPDATE learner_program_enrollments
     SET status='WITHDRAWN',withdrawn_at=statement_timestamp()
   WHERE id=v_program_enroll;
  IF NOT EXISTS (SELECT 1 FROM section_enrollments
                  WHERE id=v_section_enroll
                    AND status='WITHDRAWN' AND ended_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Withdrawn program left live section history';
  END IF;

  RAISE NOTICE 'DB02 activation role lifecycle PASS';
END;
$db02_role_lifecycle$;
ROLLBACK;
