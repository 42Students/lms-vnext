-- DB03 / Issue #214: source-exact elective year and college guards.
-- Forward-only, SQL-owned triggers: no Drizzle column or table shape changes.
-- Fail closed for existing invalid vNext rows; do not rewrite original 0306.
CREATE FUNCTION db03_slot_year_is_valid(label text) RETURNS boolean
 LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE AS $year$
DECLARE first_year integer; expected_end integer; actual_end integer;
BEGIN
 IF label IS NULL THEN RETURN true; END IF;
 IF label !~ '^[0-9]{4}(-[0-9]{2}|-[0-9]{4})?$' THEN RETURN false; END IF;
 first_year := left(label,4)::integer;
 IF first_year < 1900 OR first_year > 9998 THEN RETURN false; END IF;
 IF length(label) = 7 THEN
   expected_end := (first_year + 1) % 100;
   actual_end := right(label,2)::integer;
   RETURN actual_end = expected_end;
 ELSIF length(label) = 9 THEN
   expected_end := first_year + 1;
   actual_end := right(label,4)::integer;
   RETURN actual_end = expected_end;
 END IF;
 RETURN length(label) = 4;
END; $year$;
--> statement-breakpoint
DO $preflight$
BEGIN
 IF EXISTS(SELECT 1 FROM elective_slots WHERE NOT db03_slot_year_is_valid(academic_year)) THEN
   RAISE EXCEPTION 'DB03 existing elective slots contain invalid year labels' USING ERRCODE='23514';
 END IF;
 IF EXISTS(
   SELECT 1 FROM elective_offerings e
     JOIN elective_slots s ON s.id=e.slot_id
     JOIN courses cr ON cr.id=e.course_id
     JOIN departments d ON d.id=cr.department_id
    WHERE e.status='ACTIVE' AND e.deleted_at IS NULL
      AND d.college_id IS DISTINCT FROM s.college_id
 ) THEN
   RAISE EXCEPTION 'DB03 existing active elective offerings cross colleges' USING ERRCODE='23514';
 END IF;
END; $preflight$;
--> statement-breakpoint
CREATE FUNCTION db03_reject_invalid_slot_year() RETURNS trigger LANGUAGE plpgsql AS $body$
BEGIN
 IF NOT db03_slot_year_is_valid(NEW.academic_year) THEN
   RAISE EXCEPTION 'DB03 invalid elective academic year' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END; $body$;
--> statement-breakpoint
CREATE TRIGGER db03_elective_slot_year_guard
 BEFORE INSERT OR UPDATE ON elective_slots
 FOR EACH ROW EXECUTE FUNCTION db03_reject_invalid_slot_year();
--> statement-breakpoint
-- Override the 0306 offering guard; preserve program and delivery checks,
-- and add the source course department's college as an immutable parent.
CREATE OR REPLACE FUNCTION db03_guard_elective_offering_program()
 RETURNS trigger LANGUAGE plpgsql AS $body$
DECLARE sp uuid; cp uuid; cid uuid; source_college uuid; slot_college uuid;
BEGIN
 IF NEW.status <> 'ACTIVE' OR NEW.deleted_at IS NOT NULL THEN RETURN NEW; END IF;
 SELECT s.program_id, cohort.program_id, co.course_id, d.college_id, s.college_id
   INTO sp,cp,cid,source_college,slot_college
   FROM elective_slots s
   JOIN course_section_deliveries delivery ON delivery.id=NEW.backed_delivery_id
   JOIN course_offerings co ON co.id=delivery.offering_id
   JOIN cohorts cohort ON cohort.id=co.cohort_id
   JOIN courses course ON course.id=co.course_id
   JOIN departments d ON d.id=course.department_id
  WHERE s.id=NEW.slot_id
  FOR SHARE OF s,delivery,co,cohort,course,d;
 IF sp IS NULL OR cp IS DISTINCT FROM sp OR cid IS DISTINCT FROM NEW.course_id
    OR source_college IS DISTINCT FROM slot_college THEN
   RAISE EXCEPTION 'DB03 elective backing program/college mismatch' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END; $body$;
--> statement-breakpoint
-- The offering insert locks source course and department FOR SHARE.
-- Reparent mutations take conflicting row locks, so the corresponding guards
-- serialize against new active offerings instead of racing the first read.
CREATE FUNCTION db03_fence_active_elective_course_college()
 RETURNS trigger LANGUAGE plpgsql AS $body$
BEGIN
 IF TG_TABLE_NAME='courses' AND NEW.department_id IS DISTINCT FROM OLD.department_id THEN
   IF EXISTS(SELECT 1 FROM elective_offerings e
              WHERE e.course_id=OLD.id AND e.status='ACTIVE' AND e.deleted_at IS NULL) THEN
     RAISE EXCEPTION 'DB03 active elective course department cannot change' USING ERRCODE='23514';
   END IF;
 ELSIF TG_TABLE_NAME='departments' AND NEW.college_id IS DISTINCT FROM OLD.college_id THEN
   IF EXISTS(SELECT 1 FROM elective_offerings e
       JOIN courses c ON c.id=e.course_id
       WHERE c.department_id=OLD.id AND e.status='ACTIVE' AND e.deleted_at IS NULL) THEN
     RAISE EXCEPTION 'DB03 active elective department college cannot change' USING ERRCODE='23514';
   END IF;
 END IF;
 RETURN NEW;
END; $body$;
--> statement-breakpoint
CREATE TRIGGER db03_active_elective_course_department_guard
 BEFORE UPDATE OF department_id ON courses
 FOR EACH ROW EXECUTE FUNCTION db03_fence_active_elective_course_college();
--> statement-breakpoint
CREATE TRIGGER db03_active_elective_department_college_guard
 BEFORE UPDATE OF college_id ON departments
 FOR EACH ROW EXECUTE FUNCTION db03_fence_active_elective_course_college();
