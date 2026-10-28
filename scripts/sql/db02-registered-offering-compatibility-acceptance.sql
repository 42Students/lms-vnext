-- DB-005: an existing authorized first-party/raw offering writer that omits
-- the new program-term columns must still create a *fully scoped* offering.
-- Disposable PG17 only: always rollback all synthetic fixtures.
BEGIN;
DO $db02_compat_test$
DECLARE
 v_program uuid:=gen_random_uuid();
 v_period uuid:=gen_random_uuid();
 v_cohort uuid:=gen_random_uuid();
 v_course uuid:=gen_random_uuid();
 v_foreign_course uuid:=gen_random_uuid();
 v_offering uuid;
 v_term uuid;
 v_curriculum uuid;
 v_role course_offering_type;
 denied boolean:=false;
BEGIN
 INSERT INTO programs(id,department_id,name,code,duration_terms)
 VALUES(v_program,'21000000-0000-4000-8000-000000000001',
        'DB005 compatibility','DB005-COMPAT-'||v_program,8);
 INSERT INTO academic_periods(id,college_id,name,code,start_date,end_date,status)
 VALUES(v_period,'20000000-0000-4000-8000-000000000001',
        'DB005 compatibility period','DB005-CP-'||v_period,'2026-07-01','2027-06-30','ACTIVE');
 INSERT INTO cohorts(id,program_id,name,code,start_period_id,status)
 VALUES(v_cohort,v_program,'DB005 compatibility cohort','DB005-CC-'||v_cohort,v_period,'ACTIVE');
 INSERT INTO courses(id,department_id,name,code,status)
 VALUES(v_course,'21000000-0000-4000-8000-000000000001',
        'DB005 compatibility course','DB005-COURSE-'||v_course,'ACTIVE');
 INSERT INTO course_offerings(id,course_id,cohort_id,academic_period_id,
        type,credits,display_order,status)
 VALUES(gen_random_uuid(),v_course,v_cohort,v_period,'CORE',4,0,'ACTIVE')
 RETURNING id INTO v_offering;
 SELECT co.program_term_id,co.program_term_course_id
 INTO v_term,v_curriculum FROM course_offerings co WHERE co.id=v_offering;
 IF v_term IS NULL OR v_curriculum IS NULL THEN
   RAISE EXCEPTION 'DB005 compatibility missing canonical term or CORE curriculum';
 END IF;
 SELECT type INTO v_role FROM program_term_courses WHERE id=v_curriculum
   AND program_term_id=v_term AND course_id=v_course;
 IF v_role IS DISTINCT FROM 'CORE' THEN
   RAISE EXCEPTION 'DB005 compatibility fabricated invalid curriculum mapping';
 END IF;
 INSERT INTO courses(id,department_id,name,code,status)
 VALUES(v_foreign_course,'21000000-0000-4000-8000-000000000002',
        'DB005 foreign course','DB005-FOREIGN-'||v_foreign_course,'ACTIVE');
 BEGIN
   INSERT INTO course_offerings(course_id,cohort_id,academic_period_id,type,display_order)
   VALUES(v_foreign_course,v_cohort,v_period,'CORE',9);
 EXCEPTION WHEN check_violation THEN denied:=true;
 END;
 IF NOT denied THEN
   RAISE EXCEPTION 'DB005 compatibility allowed cross-college offering';
 END IF;
END;
$db02_compat_test$;
ROLLBACK;
