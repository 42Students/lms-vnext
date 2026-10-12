-- DB-005 / DB02 first registered academic tenant-ownership integration.
-- Forward-only and additive: the source schema does not gain columns in this
-- migration, so 0049's Drizzle snapshot intentionally equals 0048.
-- Prevent raw SQL from reparenting a department, program or course across
-- colleges, including a concurrent department move; program/course guards
-- SHARE-lock their relevant department rows. Full DB02 progression, curriculum
-- and schedule drafts remain UNREGISTERED / DB-005 NOT DONE.
-- Verified via registered empty-PG17 replay and direct SQL negative acceptance.
CREATE FUNCTION db02_guard_department_college_immutability()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.college_id <> OLD.college_id THEN
    RAISE EXCEPTION 'Department cannot move to another college'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

--> statement-breakpoint
CREATE TRIGGER db02_department_college_immutable
BEFORE UPDATE OF college_id ON departments
FOR EACH ROW EXECUTE FUNCTION db02_guard_department_college_immutability();

--> statement-breakpoint
CREATE FUNCTION db02_guard_program_department_move()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  old_college uuid;
  new_college uuid;
BEGIN
  IF NEW.department_id = OLD.department_id THEN
    RETURN NEW;
  END IF;

  SELECT college_id INTO old_college FROM departments WHERE id = OLD.department_id FOR SHARE;
  SELECT college_id INTO new_college FROM departments WHERE id = NEW.department_id FOR SHARE;

  IF old_college IS NULL OR new_college IS NULL THEN
    RAISE EXCEPTION 'Unknown program department'
      USING ERRCODE = '23503';
  END IF;

  IF old_college <> new_college THEN
    RAISE EXCEPTION 'Program department move must stay within one college'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

--> statement-breakpoint
CREATE TRIGGER db02_program_department_move_guard
BEFORE UPDATE OF department_id ON programs
FOR EACH ROW EXECUTE FUNCTION db02_guard_program_department_move();

--> statement-breakpoint
CREATE FUNCTION db02_guard_course_department_move()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  old_college uuid;
  new_college uuid;
BEGIN
  IF NEW.department_id = OLD.department_id THEN
    RETURN NEW;
  END IF;

  SELECT college_id INTO old_college FROM departments WHERE id = OLD.department_id FOR SHARE;
  SELECT college_id INTO new_college FROM departments WHERE id = NEW.department_id FOR SHARE;

  IF old_college IS NULL OR new_college IS NULL THEN
    RAISE EXCEPTION 'Unknown course department'
      USING ERRCODE = '23503';
  END IF;

  IF old_college <> new_college THEN
    RAISE EXCEPTION 'Course department move must stay within one college'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

--> statement-breakpoint
CREATE TRIGGER db02_course_department_move_guard
BEFORE UPDATE OF department_id ON courses
FOR EACH ROW EXECUTE FUNCTION db02_guard_course_department_move();
