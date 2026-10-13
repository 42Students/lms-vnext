-- DB-005: registered program/cohort archive invariants and row-lock races.
-- Postgres rejects direct-SQL archive of a program with living cohorts and
-- prevents cohort creation/reactivation after its program becomes archived.
-- The program row SHARE lock in the cohort guard serializes archive races.
-- The distinct INACTIVE cohort status belongs to later DB02 staged work.
--> statement-breakpoint
CREATE FUNCTION db02_guard_cohort_status_lifecycle()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_program_status program_status;
BEGIN
  -- A cohort is a live child of its academic program. Lock the program row
  -- against concurrent ARCHIVE before allowing creation/reactivation.
  SELECT status INTO v_program_status FROM programs
   WHERE id = NEW.program_id FOR SHARE;
  IF v_program_status IS DISTINCT FROM 'ACTIVE'
     AND (TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM 'ARCHIVED') THEN
    RAISE EXCEPTION 'Cannot activate or create a cohort under archived program'
      USING ERRCODE='23514';
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'ARCHIVED' THEN
      RAISE EXCEPTION 'Cohort cannot be created already archived'
        USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.status = 'ARCHIVED' AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Archived cohort status is terminal'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.status = 'ARCHIVED'
     AND OLD.status NOT IN ('PLANNED', 'COMPLETED') THEN
    RAISE EXCEPTION 'Cohort may archive only from PLANNED or COMPLETED'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

--> statement-breakpoint
CREATE TRIGGER db02_cohort_status_lifecycle_guard
BEFORE INSERT OR UPDATE OF status ON cohorts
FOR EACH ROW EXECUTE FUNCTION db02_guard_cohort_status_lifecycle();

--> statement-breakpoint
CREATE FUNCTION db02_guard_program_archive_with_live_cohorts()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'ACTIVE' AND NEW.status = 'ARCHIVED'
     AND EXISTS (
       SELECT 1 FROM cohorts c
        WHERE c.program_id = OLD.id
          AND c.status <> 'ARCHIVED'
     ) THEN
    RAISE EXCEPTION 'Cannot archive program with nonarchived cohorts'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;

--> statement-breakpoint
CREATE TRIGGER db02_program_archive_cohort_dependency_guard
BEFORE UPDATE OF status ON programs
FOR EACH ROW EXECUTE FUNCTION db02_guard_program_archive_with_live_cohorts();
