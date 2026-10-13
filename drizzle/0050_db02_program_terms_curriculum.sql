-- DB-005 / DB02 curriculum parents: registered in Drizzle after 0049.
-- Both structures have application-visible Drizzle types. Tenant scope is
-- enforced on direct SQL with shared parent locks, not only in services.
-- This is a partial DB-005 integration, not global academic phase certification.
CREATE TABLE "program_terms" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "program_id" uuid NOT NULL,
  "term_number" integer NOT NULL,
  "name" text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "total_credits" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "program_terms_program_number_uq" UNIQUE("program_id","term_number"),
  CONSTRAINT "program_terms_term_number_ck" CHECK ("term_number" >= 1),
  CONSTRAINT "program_terms_name_ck" CHECK (btrim("name") <> ''),
  CONSTRAINT "program_terms_total_credits_ck" CHECK ("total_credits" is null or "total_credits" >= 0)
);
--> statement-breakpoint
CREATE TABLE "program_term_courses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "program_term_id" uuid NOT NULL,
  "course_id" uuid NOT NULL,
  "type" "course_offering_type" DEFAULT 'CORE' NOT NULL,
  "credits" integer,
  "display_order" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "program_term_courses_term_course_uq" UNIQUE("program_term_id","course_id"),
  CONSTRAINT "program_term_courses_credits_ck" CHECK ("credits" is null or "credits" between 0 and 30),
  CONSTRAINT "program_term_courses_display_order_ck" CHECK ("display_order" >= 1)
);
--> statement-breakpoint
ALTER TABLE "program_terms" ADD CONSTRAINT "program_terms_program_id_programs_id_fk"
 FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "program_term_courses" ADD CONSTRAINT "program_term_courses_program_term_id_program_terms_id_fk"
 FOREIGN KEY ("program_term_id") REFERENCES "public"."program_terms"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "program_term_courses" ADD CONSTRAINT "program_term_courses_course_id_courses_id_fk"
 FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "program_terms_program_active_idx" ON "program_terms" USING btree ("program_id","is_active","term_number");
--> statement-breakpoint
CREATE INDEX "program_term_courses_course_idx" ON "program_term_courses" USING btree ("course_id","program_term_id");
--> statement-breakpoint
CREATE FUNCTION db02_guard_program_term_bounds()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE max_terms integer;
BEGIN
 SELECT duration_terms INTO max_terms FROM programs WHERE id = NEW.program_id FOR SHARE;
 IF max_terms IS NULL THEN RAISE EXCEPTION 'Unknown program' USING ERRCODE='23503'; END IF;
 IF NEW.term_number > max_terms THEN
   RAISE EXCEPTION 'Program term exceeds configured program duration' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER db02_program_term_bounds_guard BEFORE INSERT OR UPDATE OF program_id,term_number ON program_terms
 FOR EACH ROW EXECUTE FUNCTION db02_guard_program_term_bounds();
--> statement-breakpoint
CREATE FUNCTION db02_guard_program_term_identity_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.program_id IS DISTINCT FROM OLD.program_id OR NEW.term_number IS DISTINCT FROM OLD.term_number THEN
  RAISE EXCEPTION 'DB02 program term identity is immutable' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER db02_program_term_identity_immutable BEFORE UPDATE OF program_id,term_number ON program_terms
 FOR EACH ROW EXECUTE FUNCTION db02_guard_program_term_identity_immutable();
--> statement-breakpoint
CREATE FUNCTION db02_guard_program_term_course_tenant()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE program_college uuid; course_college uuid;
BEGIN
 SELECT d.college_id INTO program_college
 FROM program_terms pt JOIN programs p ON p.id=pt.program_id
 JOIN departments d ON d.id=p.department_id
 WHERE pt.id=NEW.program_term_id FOR SHARE OF pt,p,d;
 SELECT d.college_id INTO course_college
 FROM courses c JOIN departments d ON d.id=c.department_id
 WHERE c.id=NEW.course_id FOR SHARE OF c,d;
 IF program_college IS NULL OR course_college IS NULL THEN
  RAISE EXCEPTION 'Unknown program term or course' USING ERRCODE='23503';
 END IF;
 IF program_college <> course_college THEN
  RAISE EXCEPTION 'Program term and course must belong to the same college' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER db02_program_term_course_tenant BEFORE INSERT OR UPDATE OF program_term_id,course_id ON program_term_courses
 FOR EACH ROW EXECUTE FUNCTION db02_guard_program_term_course_tenant();
--> statement-breakpoint
CREATE FUNCTION db02_guard_program_term_course_identity()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.program_term_id IS DISTINCT FROM OLD.program_term_id OR NEW.course_id IS DISTINCT FROM OLD.course_id THEN
  RAISE EXCEPTION 'Program-term course identity is immutable' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER db02_program_term_course_identity_guard BEFORE UPDATE OF program_term_id,course_id ON program_term_courses
 FOR EACH ROW EXECUTE FUNCTION db02_guard_program_term_course_identity();
--> statement-breakpoint
CREATE FUNCTION db02_guard_program_duration_term_floor()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.duration_terms < OLD.duration_terms AND EXISTS
  (SELECT 1 FROM program_terms WHERE program_id=OLD.id AND term_number>NEW.duration_terms) THEN
  RAISE EXCEPTION 'Cannot shorten program below existing term number' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER db02_program_duration_term_floor BEFORE UPDATE OF duration_terms ON programs
 FOR EACH ROW EXECUTE FUNCTION db02_guard_program_duration_term_floor();
