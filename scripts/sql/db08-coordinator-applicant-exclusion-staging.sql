-- W04 DB08 staged draft ONLY. W01 owns registered Drizzle migrations and replay.
-- Existing placement_applications and placement_drive_day_coordinator_assignments
-- must be mutually exclusive per (job_id, learner_membership_id), regardless
-- of an application's status or the coordinator's on_date.
-- Both transactions lock placement_jobs first to serialize the missing-row case.
CREATE FUNCTION db08_guard_learner_drive_role() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Do not rely on an FK lock to serialize inserts for the same drive.
  PERFORM 1 FROM placement_jobs WHERE id=NEW.job_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown placement drive' USING ERRCODE='23503';
  END IF;

  IF TG_TABLE_NAME = 'placement_applications' THEN
    IF EXISTS (SELECT 1 FROM placement_drive_day_coordinator_assignments c
               WHERE c.job_id=NEW.job_id AND c.learner_membership_id=NEW.membership_id) THEN
      RAISE EXCEPTION 'A drive coordinator cannot apply to the same drive'
        USING ERRCODE='23514';
    END IF;
  ELSIF TG_TABLE_NAME = 'placement_drive_day_coordinator_assignments' THEN
    IF EXISTS (SELECT 1 FROM placement_applications a
               WHERE a.job_id=NEW.job_id AND a.membership_id=NEW.learner_membership_id) THEN
      RAISE EXCEPTION 'An applicant cannot coordinate the same drive'
        USING ERRCODE='23514';
    END IF;
  ELSE
    RAISE EXCEPTION 'Unexpected DB08 trigger table' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER db08_application_coordinator_exclusion
BEFORE INSERT OR UPDATE OF job_id, membership_id ON placement_applications
FOR EACH ROW EXECUTE FUNCTION db08_guard_learner_drive_role();

CREATE TRIGGER db08_coordinator_application_exclusion
BEFORE INSERT OR UPDATE OF job_id, learner_membership_id
ON placement_drive_day_coordinator_assignments
FOR EACH ROW EXECUTE FUNCTION db08_guard_learner_drive_role();

-- W01 review requirements:
-- 1. Reconcile with any DB08 batch changes and existing trigger order.
-- 2. Seed one learner; test same-drive two-writer interleavings and cross-college
--    direct SQL, including updates, rollbacks, and repeated on-date assignment.
-- 3. New vNext rows are greenfield; do not add production backfill logic.
-- 4. No service can claim runtime parity before registered migration replay.
