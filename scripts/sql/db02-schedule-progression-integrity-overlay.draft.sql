-- Unregistered DB02 integrity overlay. Apply AFTER canonical DB02 and the
-- parent/enrollment extension, on a DISPOSABLE PostgreSQL database only.
-- Chat 1 must reconcile/integrate; no registered migration or execution claimed.
-- Canonical reviewed blob: 8007c078bec184dbedd8b96e368476d4e510343b.
--
-- Concurrent-main reconciliation note:
-- The canonical SQL now handles nested ON DELETE SET NULL in its progression
-- state guard, and its history AFTER UPDATE trigger no longer fires on actor-only
-- updates. Do not replace either canonical function from this overlay: doing so
-- would overwrite newer semantics and could forge correction events.
--
-- 2) State identity and lifecycle: the initializer creates one row per cohort.
-- A direct cohort_id change would attach progress to the wrong cohort while leaving
-- immutable event history on the old identity; DELETE/TRUNCATE would silently lose it.
CREATE FUNCTION db02_guard_progression_state_identity()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' OR TG_OP = 'TRUNCATE' THEN
    RAISE EXCEPTION 'Canonical cohort progression state is not deletable'
      USING ERRCODE='23514';
  END IF;
  IF NEW.cohort_id IS DISTINCT FROM OLD.cohort_id THEN
    RAISE EXCEPTION 'Canonical cohort progression cannot switch cohort identity'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_progression_state_identity_guard
BEFORE UPDATE OF cohort_id OR DELETE ON cohort_progression_state
FOR EACH ROW EXECUTE FUNCTION db02_guard_progression_state_identity();

CREATE TRIGGER db02_progression_state_no_truncate
BEFORE TRUNCATE ON cohort_progression_state
FOR EACH STATEMENT EXECUTE FUNCTION db02_guard_progression_state_identity();

-- 3) Prevent timestamp-only UPDATEs from resurrecting historical scheduled
-- events into future bookings on an ARCHIVED hall. The canonical tenant/hall
-- guard runs on section/actor/hall/status changes, not bare starts_at/ends_at.
-- FOR SHARE on the hall row serializes against an archive UPDATE.
CREATE FUNCTION db02_guard_future_schedule_room_lifecycle()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  current_hall_status varchar(32);
BEGIN
  IF NEW.lecture_hall_id IS NULL
     OR NEW.status <> 'SCHEDULED'
     OR NEW.ends_at <= statement_timestamp() THEN
    RETURN NEW;
  END IF;
  SELECT status INTO current_hall_status
    FROM lecture_halls
   WHERE id = NEW.lecture_hall_id
   FOR SHARE;
  IF current_hall_status IS DISTINCT FROM 'ACTIVE' THEN
    RAISE EXCEPTION 'Future schedule requires an ACTIVE lecture hall'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db02_schedule_future_hall_lifecycle_guard
BEFORE INSERT OR UPDATE OF starts_at, ends_at, status, lecture_hall_id
ON section_schedule_events
FOR EACH ROW EXECUTE FUNCTION db02_guard_future_schedule_room_lifecycle();

-- Acceptance (UNEXECUTED): archived hall cannot receive future booking through
-- timestamp-only UPDATE; historical past sessions remain; archive/book race
-- serializes; deleting only academic-audit actor preserves term/version/history;
-- direct UPDATE cohort_id, DELETE and TRUNCATE progression state fail.
