-- DB-005 DB02 registered lecture halls, timetable tenant integrity,
-- hall archive/booking locks, overlap exclusions and faculty role guards.
-- btree_gist is required for deterministic PostgreSQL exclusion constraints.
--> statement-breakpoint
CREATE TABLE "lecture_halls" (
 "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 "college_id" uuid NOT NULL,
 "department_id" uuid,
 "name" varchar(255) NOT NULL,
 "capacity" integer NOT NULL,
 "description" varchar(255),
 "room_type" varchar(64) NOT NULL,
 "status" varchar(32) DEFAULT 'ACTIVE' NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
 CONSTRAINT "lecture_halls_name_ck" CHECK (btrim("name") <> ''),
 CONSTRAINT "lecture_halls_capacity_ck" CHECK ("capacity" between 1 and 5000),
 CONSTRAINT "lecture_halls_room_type_ck" CHECK ("room_type" in ('CLASSROOM','LECTURE_HALL','LAB','SEMINAR_HALL','AUDITORIUM','CONFERENCE_ROOM')),
 CONSTRAINT "lecture_halls_status_ck" CHECK ("status" in ('ACTIVE','ARCHIVED'))
);
--> statement-breakpoint
ALTER TABLE "lecture_halls" ADD CONSTRAINT "lecture_halls_college_id_colleges_id_fk"
 FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lecture_halls" ADD CONSTRAINT "lecture_halls_department_id_departments_id_fk"
 FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX lecture_halls_active_college_name_uq
  ON lecture_halls(college_id, lower(name))
  WHERE status = 'ACTIVE';

--> statement-breakpoint
CREATE INDEX lecture_halls_department_idx
  ON lecture_halls(department_id, status);

--> statement-breakpoint
CREATE FUNCTION db02_guard_lecture_hall_department()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  department_college uuid;
BEGIN
  IF NEW.department_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT college_id INTO department_college FROM departments WHERE id=NEW.department_id;
  IF department_college IS NULL THEN
    RAISE EXCEPTION 'Unknown lecture hall department' USING ERRCODE='23503';
  END IF;
  IF department_college <> NEW.college_id THEN
    RAISE EXCEPTION 'Lecture hall department must belong to the same college'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;

--> statement-breakpoint
CREATE TRIGGER db02_lecture_hall_department_guard
BEFORE INSERT OR UPDATE OF college_id, department_id ON lecture_halls
FOR EACH ROW EXECUTE FUNCTION db02_guard_lecture_hall_department();

--> statement-breakpoint
ALTER TABLE section_schedule_events ADD COLUMN "lecture_hall_id" uuid;
--> statement-breakpoint
ALTER TABLE section_schedule_events ADD CONSTRAINT "section_schedule_events_lecture_hall_id_lecture_halls_id_fk"
  FOREIGN KEY ("lecture_hall_id") REFERENCES "public"."lecture_halls"("id") ON DELETE restrict ON UPDATE no action;

--> statement-breakpoint
CREATE INDEX section_schedule_events_hall_time_idx
  ON section_schedule_events(lecture_hall_id, starts_at, ends_at)
  WHERE lecture_hall_id IS NOT NULL AND status = 'SCHEDULED';

--> statement-breakpoint
CREATE FUNCTION db02_guard_schedule_hall_tenant()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  section_college uuid;
  section_status_value section_status;
  faculty_college uuid;
  hall_college uuid;
BEGIN
  SELECT d.college_id, s.status
    INTO section_college, section_status_value
    FROM sections s
    JOIN cohorts c ON c.id = s.cohort_id
    JOIN programs p ON p.id = c.program_id
    JOIN departments d ON d.id = p.department_id
   WHERE s.id = NEW.section_id
   FOR SHARE OF s;

  IF section_college IS NULL THEN
    RAISE EXCEPTION 'Unknown schedule section scope' USING ERRCODE = '23503';
  END IF;

  IF NEW.status = 'SCHEDULED' AND section_status_value IS DISTINCT FROM 'ACTIVE' THEN
    RAISE EXCEPTION 'Scheduled event requires an ACTIVE section'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.faculty_membership_id IS NOT NULL THEN
    SELECT college_id INTO faculty_college
      FROM college_memberships
     WHERE id = NEW.faculty_membership_id AND status = 'ACTIVE'
     FOR SHARE;
    IF faculty_college IS NULL THEN
      RAISE EXCEPTION 'Unknown or inactive faculty membership' USING ERRCODE = '23503';
    END IF;

    PERFORM 1
      FROM membership_roles mr
     WHERE mr.membership_id = NEW.faculty_membership_id
       AND mr.role = 'FACULTY'
     FOR SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Scheduled instructor must have the FACULTY role'
        USING ERRCODE = '23514';
    END IF;
    IF faculty_college <> section_college THEN
      RAISE EXCEPTION 'Schedule faculty must belong to the section college'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  IF NEW.lecture_hall_id IS NOT NULL THEN
    SELECT college_id INTO hall_college
      FROM lecture_halls
     WHERE id = NEW.lecture_hall_id
       AND (status = 'ACTIVE' OR NEW.status = 'CANCELLED')
     FOR SHARE;
    IF hall_college IS NULL THEN
      RAISE EXCEPTION 'Unknown or inactive lecture hall' USING ERRCODE = '23503';
    END IF;
    IF section_college <> hall_college THEN
      RAISE EXCEPTION 'Schedule section and lecture hall must belong to the same college'
        USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

--> statement-breakpoint
CREATE TRIGGER db02_schedule_hall_tenant_guard
BEFORE INSERT OR UPDATE OF section_id, faculty_membership_id, lecture_hall_id, status, starts_at, ends_at
ON section_schedule_events
FOR EACH ROW EXECUTE FUNCTION db02_guard_schedule_hall_tenant();

-- Serialize hall archival with booking creation. The schedule trigger takes FOR SHARE on the
-- hall; an archive UPDATE takes the conflicting row lock. Whichever wins first determines the
-- valid result without allowing an ACTIVE future booking to reference an archived hall.
--> statement-breakpoint
CREATE FUNCTION db02_guard_lecture_hall_archive()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'ACTIVE' AND NEW.status = 'ARCHIVED' AND EXISTS (
    SELECT 1
      FROM section_schedule_events e
     WHERE e.lecture_hall_id = OLD.id
       AND e.status = 'SCHEDULED'
       AND e.ends_at > now()
  ) THEN
    RAISE EXCEPTION 'Cannot archive lecture hall with active or future scheduled sessions'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

--> statement-breakpoint
CREATE TRIGGER db02_lecture_hall_archive_guard
BEFORE UPDATE OF status ON lecture_halls
FOR EACH ROW EXECUTE FUNCTION db02_guard_lecture_hall_archive();

-- PostgreSQL overlap invariants. Chat 1 must confirm btree_gist is available in the
-- target Cloud SQL/PostgreSQL environment before registering this section.
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS btree_gist;

--> statement-breakpoint
ALTER TABLE section_schedule_events
  ADD CONSTRAINT section_schedule_events_section_no_overlap_excl
  EXCLUDE USING gist (
    section_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  ) WHERE (status = 'SCHEDULED');

--> statement-breakpoint
ALTER TABLE section_schedule_events
  ADD CONSTRAINT section_schedule_events_faculty_no_overlap_excl
  EXCLUDE USING gist (
    faculty_membership_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  ) WHERE (status = 'SCHEDULED' AND faculty_membership_id IS NOT NULL);

--> statement-breakpoint
ALTER TABLE section_schedule_events
  ADD CONSTRAINT section_schedule_events_hall_no_overlap_excl
  EXCLUDE USING gist (
    lecture_hall_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  ) WHERE (status = 'SCHEDULED' AND lecture_hall_id IS NOT NULL);

-- ---------------------------------------------------------------------------
-- 3a) Section faculty assignment tenant/role integrity
-- ---------------------------------------------------------------------------
--> statement-breakpoint
CREATE FUNCTION db02_guard_section_faculty_assignment_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  section_college uuid;
  section_status_value section_status;
  membership_college uuid;
  membership_status_value membership_status;
BEGIN
  SELECT d.college_id, s.status
    INTO section_college, section_status_value
    FROM sections s
    JOIN cohorts c ON c.id = s.cohort_id
    JOIN programs p ON p.id = c.program_id
    JOIN departments d ON d.id = p.department_id
   WHERE s.id = NEW.section_id
   FOR SHARE OF s;

  SELECT cm.college_id, cm.status
    INTO membership_college, membership_status_value
    FROM college_memberships cm
   WHERE cm.id = NEW.membership_id
   FOR SHARE;

  IF section_college IS NULL OR membership_college IS NULL THEN
    RAISE EXCEPTION 'Unknown section or faculty membership'
      USING ERRCODE = '23503';
  END IF;

  IF section_college <> membership_college THEN
    RAISE EXCEPTION 'Section faculty assignment must stay within one college'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.ended_at IS NULL THEN
    IF section_status_value IS DISTINCT FROM 'ACTIVE'
       OR membership_status_value IS DISTINCT FROM 'ACTIVE' THEN
      RAISE EXCEPTION 'Active section faculty assignment requires ACTIVE section and membership'
        USING ERRCODE = '23514';
    END IF;

    PERFORM 1
      FROM membership_roles mr
     WHERE mr.membership_id = NEW.membership_id
       AND mr.role = 'FACULTY'
     FOR SHARE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Section faculty assignment requires FACULTY role'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

--> statement-breakpoint
CREATE TRIGGER db02_section_faculty_assignment_scope_guard
BEFORE INSERT OR UPDATE OF section_id, membership_id, ended_at
ON section_faculty_assignments
FOR EACH ROW EXECUTE FUNCTION db02_guard_section_faculty_assignment_scope();

-- ---------------------------------------------------------------------------
-- 3b) Course teaching assignment tenant/role integrity
-- ---------------------------------------------------------------------------
--> statement-breakpoint
CREATE FUNCTION db02_guard_course_teaching_assignment_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  delivery_college uuid;
  delivery_ended_at timestamptz;
  offering_status_value course_offering_status;
  course_status_value course_status;
  section_status_value section_status;
  membership_college uuid;
  membership_status_value membership_status;
BEGIN
  SELECT d.college_id, csd.ended_at, co.status, crs.status, s.status
    INTO delivery_college, delivery_ended_at, offering_status_value,
         course_status_value, section_status_value
    FROM course_section_deliveries csd
    JOIN course_offerings co ON co.id = csd.offering_id
    JOIN courses crs ON crs.id = co.course_id
    JOIN sections s ON s.id = csd.section_id
    JOIN cohorts c ON c.id = co.cohort_id
    JOIN programs p ON p.id = c.program_id
    JOIN departments d ON d.id = p.department_id
   WHERE csd.id = NEW.delivery_id
   FOR SHARE OF csd, co, crs, s;

  SELECT cm.college_id, cm.status
    INTO membership_college, membership_status_value
    FROM college_memberships cm
   WHERE cm.id = NEW.membership_id
   FOR SHARE;

  IF delivery_college IS NULL OR membership_college IS NULL THEN
    RAISE EXCEPTION 'Unknown delivery or faculty membership'
      USING ERRCODE = '23503';
  END IF;

  IF delivery_college <> membership_college THEN
    RAISE EXCEPTION 'Course teaching assignment must stay within one college'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.ended_at IS NULL THEN
    IF delivery_ended_at IS NOT NULL
       OR offering_status_value IS DISTINCT FROM 'ACTIVE'
       OR course_status_value IS DISTINCT FROM 'ACTIVE'
       OR section_status_value IS DISTINCT FROM 'ACTIVE'
       OR membership_status_value IS DISTINCT FROM 'ACTIVE' THEN
      RAISE EXCEPTION 'Active teaching assignment requires active delivery chain and membership'
        USING ERRCODE = '23514';
    END IF;

    PERFORM 1
      FROM membership_roles mr
     WHERE mr.membership_id = NEW.membership_id
       AND mr.role = 'FACULTY'
     FOR SHARE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Course teaching assignment requires FACULTY role'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

--> statement-breakpoint
CREATE TRIGGER db02_course_teaching_assignment_scope_guard
BEFORE INSERT OR UPDATE OF delivery_id, membership_id, ended_at
ON course_teaching_assignments
FOR EACH ROW EXECUTE FUNCTION db02_guard_course_teaching_assignment_scope();

-- ---------------------------------------------------------------------------

