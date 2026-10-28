-- DB-006 registered PostgreSQL elective direct-write and cross-program guards.
-- SQL-only triggers: Drizzle snapshot shape is unchanged.
CREATE FUNCTION db03_guard_elective_member_academics() RETURNS trigger LANGUAGE plpgsql AS $body$
DECLARE x record; k text; y integer; used integer;
BEGIN
  IF NEW.state NOT IN ('ACTIVE','WAITLISTED') THEN RETURN NEW; END IF;
  SELECT kind INTO k FROM lms_groups WHERE id=NEW.group_id;
  IF k IS DISTINCT FROM 'ELECTIVE' THEN RETURN NEW; END IF;
  IF NEW.member_type <> 'LEARNER' THEN
    RAISE EXCEPTION 'DB03 elective member must be learner' USING ERRCODE='23514';
  END IF;
  -- Serializes direct SQL joins across different groups of the same slot.
  SELECT s.id,s.college_id,s.program_id,s.academic_period_id,
         s.semester_number,s.academic_year,s.max_pick INTO x
    FROM elective_offerings o JOIN elective_slots s ON s.id=o.slot_id
   WHERE o.group_id=NEW.group_id AND o.status='ACTIVE' AND o.deleted_at IS NULL
     AND s.status='ACTIVE' AND s.deleted_at IS NULL FOR UPDATE OF s;
  IF NOT FOUND THEN RAISE EXCEPTION 'DB03 elective slot inactive' USING ERRCODE='23514'; END IF;
  y := NULL;
  IF x.academic_year IS NOT NULL THEN
    IF x.academic_year !~ '^[0-9]{4}(-[0-9]{2}|-[0-9]{4})?$' THEN
      RAISE EXCEPTION 'DB03 invalid academic year' USING ERRCODE='23514';
    END IF;
    y:=left(x.academic_year,4)::integer;
    IF length(x.academic_year)>4 AND
      right(x.academic_year,length(x.academic_year)-5)::integer
        NOT IN ((y+1)%100,y+1) THEN
      RAISE EXCEPTION 'DB03 invalid academic year' USING ERRCODE='23514';
    END IF;
  END IF;
  PERFORM 1 FROM learner_program_enrollments l
    JOIN programs p ON p.id=l.program_id
    JOIN departments d ON d.id=p.department_id
    JOIN section_enrollments se ON se.learner_enrollment_id=l.id
    JOIN sections h ON h.id=se.section_id
    JOIN cohort_progression_state cp ON cp.cohort_id=l.cohort_id
   WHERE l.membership_id=NEW.membership_id AND l.status='ACTIVE'
     AND se.status='ACTIVE' AND h.status='ACTIVE'
     AND l.program_id=x.program_id AND d.college_id=x.college_id
     AND h.cohort_id=l.cohort_id AND h.academic_period_id=se.academic_period_id
     AND (x.academic_period_id IS NULL OR se.academic_period_id=x.academic_period_id)
     AND cp.current_term_number=x.semester_number
     AND (y IS NULL OR cp.current_academic_year_start IS NULL OR cp.current_academic_year_start=y)
   FOR SHARE OF l,se,cp;
  IF NOT FOUND THEN RAISE EXCEPTION 'DB03 elective academic eligibility mismatch' USING ERRCODE='23514'; END IF;
  SELECT count(*)::integer INTO used FROM lms_group_members m
    JOIN elective_offerings o ON o.group_id=m.group_id
   WHERE o.slot_id=x.id AND o.status='ACTIVE' AND o.deleted_at IS NULL
     AND m.membership_id=NEW.membership_id AND m.id IS DISTINCT FROM NEW.id
     AND m.state IN ('ACTIVE','WAITLISTED');
  IF used >= x.max_pick THEN RAISE EXCEPTION 'DB03 elective max_pick exceeded' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END; $body$;
--> statement-breakpoint
CREATE TRIGGER db03_elective_member_academics_guard
 BEFORE INSERT OR UPDATE OF group_id,membership_id,member_type,state ON lms_group_members
 FOR EACH ROW EXECUTE FUNCTION db03_guard_elective_member_academics();
--> statement-breakpoint
CREATE FUNCTION db03_guard_elective_offering_program() RETURNS trigger LANGUAGE plpgsql AS $body$
DECLARE sp uuid; cp uuid; cid uuid;
BEGIN
  IF NEW.status <> 'ACTIVE' OR NEW.deleted_at IS NOT NULL THEN RETURN NEW; END IF;
  SELECT s.program_id,c.program_id,co.course_id INTO sp,cp,cid
    FROM elective_slots s
    JOIN course_section_deliveries cd ON cd.id=NEW.backed_delivery_id
    JOIN course_offerings co ON co.id=cd.offering_id
    JOIN cohorts c ON c.id=co.cohort_id
   WHERE s.id=NEW.slot_id FOR SHARE OF s,cd,co,c;
  IF sp IS NULL OR cp IS DISTINCT FROM sp OR cid IS DISTINCT FROM NEW.course_id THEN
    RAISE EXCEPTION 'DB03 elective backing program mismatch' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END; $body$;
--> statement-breakpoint
CREATE TRIGGER db03_elective_offering_program_guard
 BEFORE INSERT OR UPDATE OF slot_id,course_id,backed_delivery_id,status,deleted_at
 ON elective_offerings FOR EACH ROW EXECUTE FUNCTION db03_guard_elective_offering_program();
--> statement-breakpoint
-- After an offering goes ACTIVE structural parent reassignment is prohibited.
-- State/ended_at changes remain allowed so colleges can close a class.
CREATE FUNCTION db03_prevent_active_elective_reparent() RETURNS trigger LANGUAGE plpgsql AS $body$
DECLARE linked boolean:=false;
BEGIN
 IF TG_TABLE_NAME='elective_slots' THEN
  IF NEW.program_id IS DISTINCT FROM OLD.program_id OR NEW.college_id IS DISTINCT FROM OLD.college_id THEN
   SELECT EXISTS(SELECT 1 FROM elective_offerings o WHERE o.slot_id=OLD.id AND o.status='ACTIVE' AND o.deleted_at IS NULL) INTO linked;
  END IF;
 ELSIF TG_TABLE_NAME='cohorts' THEN
  IF NEW.program_id IS DISTINCT FROM OLD.program_id THEN
   SELECT EXISTS(SELECT 1 FROM elective_offerings o
    JOIN course_section_deliveries d ON d.id=o.backed_delivery_id
    JOIN course_offerings c ON c.id=d.offering_id
    WHERE c.cohort_id=OLD.id AND o.status='ACTIVE' AND o.deleted_at IS NULL) INTO linked;
  END IF;
 ELSIF TG_TABLE_NAME='course_offerings' THEN
  IF NEW.course_id IS DISTINCT FROM OLD.course_id OR NEW.cohort_id IS DISTINCT FROM OLD.cohort_id
     OR NEW.academic_period_id IS DISTINCT FROM OLD.academic_period_id OR NEW.type IS DISTINCT FROM OLD.type THEN
   SELECT EXISTS(SELECT 1 FROM elective_offerings o
    JOIN course_section_deliveries d ON d.id=o.backed_delivery_id
    WHERE d.offering_id=OLD.id AND o.status='ACTIVE' AND o.deleted_at IS NULL) INTO linked;
  END IF;
 ELSIF TG_TABLE_NAME='course_section_deliveries' THEN
  IF NEW.offering_id IS DISTINCT FROM OLD.offering_id OR NEW.section_id IS DISTINCT FROM OLD.section_id THEN
   SELECT EXISTS(SELECT 1 FROM elective_offerings o WHERE o.backed_delivery_id=OLD.id AND o.status='ACTIVE' AND o.deleted_at IS NULL) INTO linked;
  END IF;
 ELSIF TG_TABLE_NAME='sections' THEN
  IF NEW.cohort_id IS DISTINCT FROM OLD.cohort_id OR NEW.academic_period_id IS DISTINCT FROM OLD.academic_period_id THEN
   SELECT EXISTS(SELECT 1 FROM elective_offerings o
    JOIN course_section_deliveries d ON d.id=o.backed_delivery_id
    WHERE d.section_id=OLD.id AND o.status='ACTIVE' AND o.deleted_at IS NULL) INTO linked;
  END IF;
 END IF;
 IF linked THEN RAISE EXCEPTION 'DB03 active elective backing cannot be reassigned' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END; $body$;
--> statement-breakpoint
CREATE TRIGGER db03_elective_slot_reparent_guard BEFORE UPDATE OF program_id,college_id
 ON elective_slots FOR EACH ROW EXECUTE FUNCTION db03_prevent_active_elective_reparent();
--> statement-breakpoint
CREATE TRIGGER db03_elective_cohort_reparent_guard BEFORE UPDATE OF program_id
 ON cohorts FOR EACH ROW EXECUTE FUNCTION db03_prevent_active_elective_reparent();
--> statement-breakpoint
CREATE TRIGGER db03_elective_course_offering_reparent_guard
 BEFORE UPDATE OF course_id,cohort_id,academic_period_id,type ON course_offerings
 FOR EACH ROW EXECUTE FUNCTION db03_prevent_active_elective_reparent();
--> statement-breakpoint
CREATE TRIGGER db03_elective_delivery_reparent_guard BEFORE UPDATE OF offering_id,section_id
 ON course_section_deliveries FOR EACH ROW EXECUTE FUNCTION db03_prevent_active_elective_reparent();
--> statement-breakpoint
CREATE TRIGGER db03_elective_section_reparent_guard BEFORE UPDATE OF cohort_id,academic_period_id
 ON sections FOR EACH ROW EXECUTE FUNCTION db03_prevent_active_elective_reparent();
