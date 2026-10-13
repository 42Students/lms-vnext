-- DB-005 DB02 registered pre-teaching faculty-course association identity.
-- Lifecycle closure on role removal, membership inactivation and course archive
-- is database-owned to prevent orphaned ACTIVE teaching/schedule links.
--> statement-breakpoint
CREATE TABLE "faculty_course_associations" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "membership_id" uuid NOT NULL,
 "course_id" uuid NOT NULL,
 "started_at" timestamp with time zone DEFAULT now() NOT NULL,
 "ended_at" timestamp with time zone,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
 CONSTRAINT "faculty_course_associations_lifecycle_ck" CHECK ("ended_at" is null or "ended_at" >= "started_at")
);
--> statement-breakpoint
ALTER TABLE "faculty_course_associations"
 ADD CONSTRAINT "faculty_course_associations_membership_id_college_memberships_id_fk"
 FOREIGN KEY ("membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "faculty_course_associations"
 ADD CONSTRAINT "faculty_course_associations_course_id_courses_id_fk"
 FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX faculty_course_associations_active_uq
  ON faculty_course_associations(membership_id, course_id)
  WHERE ended_at IS NULL;

--> statement-breakpoint
CREATE INDEX faculty_course_associations_course_active_idx
  ON faculty_course_associations(course_id, membership_id)
  WHERE ended_at IS NULL;

--> statement-breakpoint
CREATE FUNCTION db02_guard_faculty_course_association_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  membership_college uuid;
  membership_status_value membership_status;
  course_college uuid;
  course_status_value course_status;
BEGIN
  SELECT cm.college_id, cm.status
    INTO membership_college, membership_status_value
    FROM college_memberships cm
   WHERE cm.id = NEW.membership_id
   FOR SHARE;

  SELECT d.college_id, c.status
    INTO course_college, course_status_value
    FROM courses c
    JOIN departments d ON d.id = c.department_id
   WHERE c.id = NEW.course_id
   FOR SHARE OF c;

  IF membership_college IS NULL OR course_college IS NULL THEN
    RAISE EXCEPTION 'Unknown faculty membership or course'
      USING ERRCODE = '23503';
  END IF;

  IF membership_college <> course_college THEN
    RAISE EXCEPTION 'Faculty-course association must stay within one college'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.ended_at IS NULL THEN
    IF membership_status_value IS DISTINCT FROM 'ACTIVE'
       OR course_status_value IS DISTINCT FROM 'ACTIVE' THEN
      RAISE EXCEPTION 'Active faculty-course association requires ACTIVE membership and course'
        USING ERRCODE = '23514';
    END IF;

    PERFORM 1
      FROM membership_roles mr
     WHERE mr.membership_id = NEW.membership_id
       AND mr.role = 'FACULTY'
     FOR SHARE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Faculty-course association requires FACULTY role'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

--> statement-breakpoint
CREATE TRIGGER db02_faculty_course_association_scope_guard
BEFORE INSERT OR UPDATE OF membership_id, course_id
ON faculty_course_associations
FOR EACH ROW EXECUTE FUNCTION db02_guard_faculty_course_association_scope();

-- Keep association lifecycle valid when identity state changes after association creation.
-- The insert/update guard alone is insufficient: admins can later remove FACULTY or suspend/end
-- the membership. These AFTER triggers close active associations in the same transaction.
--> statement-breakpoint
CREATE FUNCTION db02_end_faculty_course_associations_on_role_removal()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.role = 'FACULTY' THEN
    UPDATE faculty_course_associations
       SET ended_at = COALESCE(ended_at, now()),
           updated_at = now()
     WHERE membership_id = OLD.membership_id
       AND ended_at IS NULL;

    UPDATE course_teaching_assignments
       SET ended_at = COALESCE(ended_at, now()),
           updated_at = now()
     WHERE membership_id = OLD.membership_id
       AND ended_at IS NULL;

    UPDATE section_faculty_assignments
       SET ended_at = COALESCE(ended_at, now()),
           updated_at = now()
     WHERE membership_id = OLD.membership_id
       AND ended_at IS NULL;

    UPDATE section_schedule_events
       SET faculty_membership_id = NULL,
           updated_at = now()
     WHERE faculty_membership_id = OLD.membership_id
       AND status = 'SCHEDULED'
       AND ends_at > now();
  END IF;
  RETURN OLD;
END;
$$;

--> statement-breakpoint
CREATE TRIGGER db02_faculty_course_associations_role_removal
AFTER DELETE ON membership_roles
FOR EACH ROW EXECUTE FUNCTION db02_end_faculty_course_associations_on_role_removal();

--> statement-breakpoint
CREATE FUNCTION db02_end_faculty_course_associations_on_membership_inactive()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'ACTIVE' AND NEW.status <> 'ACTIVE' THEN
    UPDATE faculty_course_associations
       SET ended_at = COALESCE(ended_at, now()),
           updated_at = now()
     WHERE membership_id = NEW.id
       AND ended_at IS NULL;

    UPDATE course_teaching_assignments
       SET ended_at = COALESCE(ended_at, now()),
           updated_at = now()
     WHERE membership_id = NEW.id
       AND ended_at IS NULL;

    UPDATE section_faculty_assignments
       SET ended_at = COALESCE(ended_at, now()),
           updated_at = now()
     WHERE membership_id = NEW.id
       AND ended_at IS NULL;

    UPDATE section_schedule_events
       SET faculty_membership_id = NULL,
           updated_at = now()
     WHERE faculty_membership_id = NEW.id
       AND status = 'SCHEDULED'
       AND ends_at > now();
  END IF;
  RETURN NEW;
END;
$$;

--> statement-breakpoint
CREATE TRIGGER db02_faculty_course_associations_membership_inactive
AFTER UPDATE OF status ON college_memberships
FOR EACH ROW EXECUTE FUNCTION db02_end_faculty_course_associations_on_membership_inactive();

--> statement-breakpoint
CREATE FUNCTION db02_end_faculty_course_associations_on_course_archive()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'ACTIVE' AND NEW.status <> 'ACTIVE' THEN
    UPDATE faculty_course_associations
       SET ended_at = COALESCE(ended_at, now()),
           updated_at = now()
     WHERE course_id = NEW.id
       AND ended_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

--> statement-breakpoint
CREATE TRIGGER db02_faculty_course_associations_course_archive
AFTER UPDATE OF status ON courses
FOR EACH ROW EXECUTE FUNCTION db02_end_faculty_course_associations_on_course_archive();

-- ---------------------------------------------------------------------------

