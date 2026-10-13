-- DB-005: registered tenant-bound academic periods, cohort and section lineage,
-- closed-window protection and immutable cohort parents. No table changes.
--> statement-breakpoint
CREATE FUNCTION db02_guard_cohort_period_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  program_college uuid;
  start_college uuid;
  end_college uuid;
  start_day date;
  expected_end_day date;
  start_status academic_period_status;
BEGIN
  SELECT d.college_id
    INTO program_college
    FROM programs p
    JOIN departments d ON d.id = p.department_id
   WHERE p.id = NEW.program_id
   FOR SHARE OF p;

  SELECT ap.college_id, ap.start_date, ap.status
    INTO start_college, start_day, start_status
    FROM academic_periods ap
   WHERE ap.id = NEW.start_period_id
   FOR SHARE OF ap;

  IF program_college IS NULL OR start_college IS NULL THEN
    RAISE EXCEPTION 'Unknown cohort program or start period'
      USING ERRCODE = '23503';
  END IF;

  IF program_college <> start_college THEN
    RAISE EXCEPTION 'Cohort program and start period must belong to one college'
      USING ERRCODE = '23514';
  END IF;

  IF start_status = 'CLOSED' THEN
    RAISE EXCEPTION 'Cohort cannot start in a closed academic period'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.expected_end_period_id IS NOT NULL THEN
    SELECT ap.college_id, ap.end_date
      INTO end_college, expected_end_day
      FROM academic_periods ap
     WHERE ap.id = NEW.expected_end_period_id
     FOR SHARE OF ap;

    IF end_college IS NULL THEN
      RAISE EXCEPTION 'Unknown cohort expected end period'
        USING ERRCODE = '23503';
    END IF;

    IF end_college <> program_college THEN
      RAISE EXCEPTION 'Cohort expected end period must belong to the program college'
        USING ERRCODE = '23514';
    END IF;

    IF expected_end_day < start_day THEN
      RAISE EXCEPTION 'Cohort expected end period cannot end before cohort start'
        USING ERRCODE = '23514';
    END IF;

    -- A PLANNED cohort may change its expected end through the API, but the parent window
    -- cannot be shrunk underneath already-materialized section/offering/progression state.
    IF TG_OP = 'UPDATE'
       AND NEW.expected_end_period_id IS DISTINCT FROM OLD.expected_end_period_id
       AND (
         EXISTS (
           SELECT 1
             FROM sections s
             JOIN academic_periods ap ON ap.id = s.academic_period_id
            WHERE s.cohort_id = OLD.id
              AND ap.end_date > expected_end_day
         )
         OR EXISTS (
           SELECT 1
             FROM course_offerings co
             JOIN academic_periods ap ON ap.id = co.academic_period_id
            WHERE co.cohort_id = OLD.id
              AND ap.end_date > expected_end_day
         )
         OR EXISTS (
           SELECT 1
             FROM cohort_progression_state cps
             JOIN academic_periods ap ON ap.id = cps.current_period_id
            WHERE cps.cohort_id = OLD.id
              AND ap.end_date > expected_end_day
         )
       ) THEN
      RAISE EXCEPTION 'Cohort expected end cannot exclude existing academic state'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

--> statement-breakpoint
CREATE TRIGGER db02_cohort_period_scope_guard
BEFORE INSERT OR UPDATE OF program_id, start_period_id, expected_end_period_id
ON cohorts
FOR EACH ROW EXECUTE FUNCTION db02_guard_cohort_period_scope();

--> statement-breakpoint
CREATE FUNCTION db02_guard_section_period_scope()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  cohort_college uuid;
  period_college uuid;
  cohort_start_day date;
  cohort_end_day date;
  period_start_day date;
  period_end_day date;
  period_status academic_period_status;
BEGIN
  SELECT d.college_id, start_ap.start_date, end_ap.end_date
    INTO cohort_college, cohort_start_day, cohort_end_day
    FROM cohorts c
    JOIN programs p ON p.id = c.program_id
    JOIN departments d ON d.id = p.department_id
    JOIN academic_periods start_ap ON start_ap.id = c.start_period_id
    LEFT JOIN academic_periods end_ap ON end_ap.id = c.expected_end_period_id
   WHERE c.id = NEW.cohort_id
   FOR SHARE OF c;

  SELECT ap.college_id, ap.start_date, ap.end_date, ap.status
    INTO period_college, period_start_day, period_end_day, period_status
    FROM academic_periods ap
   WHERE ap.id = NEW.academic_period_id
   FOR SHARE OF ap;

  IF cohort_college IS NULL OR period_college IS NULL THEN
    RAISE EXCEPTION 'Unknown section cohort or academic period'
      USING ERRCODE = '23503';
  END IF;

  IF cohort_college <> period_college THEN
    RAISE EXCEPTION 'Section cohort and academic period must belong to one college'
      USING ERRCODE = '23514';
  END IF;

  IF period_status = 'CLOSED' THEN
    RAISE EXCEPTION 'Section cannot be created or moved into a closed academic period'
      USING ERRCODE = '23514';
  END IF;

  IF period_start_day < cohort_start_day
     OR (cohort_end_day IS NOT NULL AND period_end_day > cohort_end_day) THEN
    RAISE EXCEPTION 'Section academic period must stay inside the cohort period window'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

--> statement-breakpoint
CREATE TRIGGER db02_section_period_scope_guard
BEFORE INSERT OR UPDATE OF cohort_id, academic_period_id
ON sections
FOR EACH ROW EXECUTE FUNCTION db02_guard_section_period_scope();

--> statement-breakpoint
CREATE FUNCTION db02_guard_course_offering_period_window()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  cohort_start_day date;
  cohort_end_day date;
  period_start_day date;
  period_end_day date;
  period_status academic_period_status;
BEGIN
  SELECT start_ap.start_date, end_ap.end_date
    INTO cohort_start_day, cohort_end_day
    FROM cohorts c
    JOIN academic_periods start_ap ON start_ap.id = c.start_period_id
    LEFT JOIN academic_periods end_ap ON end_ap.id = c.expected_end_period_id
   WHERE c.id = NEW.cohort_id
   FOR SHARE OF c;

  SELECT ap.start_date, ap.end_date, ap.status
    INTO period_start_day, period_end_day, period_status
    FROM academic_periods ap
   WHERE ap.id = NEW.academic_period_id
   FOR SHARE OF ap;

  IF cohort_start_day IS NULL OR period_start_day IS NULL THEN
    RAISE EXCEPTION 'Unknown course offering cohort or academic period'
      USING ERRCODE = '23503';
  END IF;

  IF period_status = 'CLOSED' THEN
    RAISE EXCEPTION 'Course offering cannot use a closed academic period'
      USING ERRCODE = '23514';
  END IF;

  IF period_start_day < cohort_start_day
     OR (cohort_end_day IS NOT NULL AND period_end_day > cohort_end_day) THEN
    RAISE EXCEPTION 'Course offering academic period must stay inside cohort window'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

--> statement-breakpoint
CREATE TRIGGER db02_course_offering_period_window_guard
BEFORE INSERT OR UPDATE OF cohort_id, academic_period_id
ON course_offerings
FOR EACH ROW EXECUTE FUNCTION db02_guard_course_offering_period_window();

--> statement-breakpoint
CREATE FUNCTION db02_guard_cohort_parent_immutable()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.program_id IS DISTINCT FROM OLD.program_id
     OR NEW.start_period_id IS DISTINCT FROM OLD.start_period_id THEN
    RAISE EXCEPTION 'DB02 cohort program/start period are immutable; use a controlled transfer'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

--> statement-breakpoint
CREATE TRIGGER db02_cohort_program_immutable
BEFORE UPDATE OF program_id, start_period_id ON cohorts
FOR EACH ROW EXECUTE FUNCTION db02_guard_cohort_parent_immutable();
