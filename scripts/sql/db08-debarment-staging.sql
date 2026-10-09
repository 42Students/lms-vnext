-- DB08-B DEBARMENT STAGING ONLY. NO journal/snapshot registration; DO NOT DEPLOY.
-- This SQL must be generated/reconciled with src/db/schema/placement-debarments.ts
-- after the DB03/DB04 integration point and replayed on a disposable database.

CREATE TABLE "placement_debarments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "college_id" uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  "membership_id" uuid NOT NULL REFERENCES college_memberships(id) ON DELETE RESTRICT,
  "reason" varchar(500) NOT NULL,
  "until_date" date,
  "until_drives" integer,
  "drives_counted" integer NOT NULL DEFAULT 0,
  "created_by_user_id" uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "lifted_at" timestamptz,
  "lifted_by_user_id" uuid REFERENCES users(id) ON DELETE RESTRICT,
  "lifted_reason" varchar(500),
  CONSTRAINT "placement_debarments_reason_ck" CHECK (length(trim(reason)) > 0),
  CONSTRAINT "placement_debarments_until_drives_ck" CHECK (until_drives IS NULL OR until_drives > 0),
  CONSTRAINT "placement_debarments_count_ck" CHECK (drives_counted >= 0),
  CONSTRAINT "placement_debarments_lift_ck" CHECK (
    (lifted_at IS NULL AND lifted_by_user_id IS NULL AND lifted_reason IS NULL)
    OR (lifted_at IS NOT NULL AND lifted_by_user_id IS NOT NULL
      AND length(trim(coalesce(lifted_reason,''))) > 0)
  )
);
CREATE INDEX "placement_debarments_member_time_idx" ON placement_debarments (membership_id,created_at);
CREATE INDEX "placement_debarments_college_idx" ON placement_debarments (college_id,lifted_at);

CREATE TABLE "placement_debarment_drive_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "debarment_id" uuid NOT NULL REFERENCES placement_debarments(id) ON DELETE RESTRICT,
  "job_id" uuid NOT NULL REFERENCES placement_jobs(id) ON DELETE RESTRICT,
  "recorded_by_user_id" uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  "recorded_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "placement_debarment_drives_unique_uq" ON placement_debarment_drive_events (debarment_id,job_id);
CREATE INDEX "placement_debarment_drives_job_idx" ON placement_debarment_drive_events (job_id);

CREATE TABLE "placement_debarment_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "debarment_id" uuid NOT NULL REFERENCES placement_debarments(id) ON DELETE RESTRICT,
  "event_type" varchar(24) NOT NULL,
  "job_id" uuid REFERENCES placement_jobs(id) ON DELETE RESTRICT,
  "reason" varchar(500),
  "actor_user_id" uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  "occurred_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "placement_debarment_history_type_ck"
    CHECK (event_type IN ('CREATED','DRIVE_COUNTED','LIFTED')),
  CONSTRAINT "placement_debarment_history_job_ck"
    CHECK ((event_type = 'DRIVE_COUNTED' AND job_id IS NOT NULL)
      OR (event_type <> 'DRIVE_COUNTED' AND job_id IS NULL))
);
CREATE INDEX "placement_debarment_history_parent_time_idx"
  ON placement_debarment_history (debarment_id,occurred_at);

-- A debarred learner's college and LEARNER role must be real.
CREATE FUNCTION db08_validate_debarment_parent() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE actual_college uuid;
BEGIN
  SELECT m.college_id INTO actual_college
    FROM college_memberships m
    JOIN membership_roles mr ON mr.membership_id=m.id AND mr.role='LEARNER'
    WHERE m.id=NEW.membership_id;
  IF actual_college IS DISTINCT FROM NEW.college_id THEN
    RAISE EXCEPTION 'Debarment member does not belong to college' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER db08_debarment_parent_guard
  BEFORE INSERT OR UPDATE ON placement_debarments
  FOR EACH ROW EXECUTE FUNCTION db08_validate_debarment_parent();

-- The DB owns audit emission for all writers, including direct SQL.
CREATE FUNCTION db08_debarment_audit() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    INSERT INTO placement_debarment_history(debarment_id,event_type,reason,actor_user_id)
      VALUES (NEW.id,'CREATED',NEW.reason,NEW.created_by_user_id);
    RETURN NEW;
  END IF;
  IF OLD.lifted_at IS NULL AND NEW.lifted_at IS NOT NULL THEN
    INSERT INTO placement_debarment_history(debarment_id,event_type,reason,actor_user_id)
      VALUES (NEW.id,'LIFTED',NEW.lifted_reason,NEW.lifted_by_user_id);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER db08_debarment_auto_audit
  AFTER INSERT OR UPDATE ON placement_debarments
  FOR EACH ROW EXECUTE FUNCTION db08_debarment_audit();

-- Every drive counter is an immutable (debarment,job) fact.
-- The trigger checks the job is the college's and the student actually applied.
-- It atomically increments drives_counted, then creates the durable event.
CREATE FUNCTION db08_debarment_count_drive() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE parent_row placement_debarments%ROWTYPE; actual_college uuid; participant boolean;
BEGIN
  SELECT * INTO parent_row FROM placement_debarments
    WHERE id=NEW.debarment_id FOR UPDATE;
  SELECT college_id INTO actual_college FROM placement_jobs WHERE id=NEW.job_id;
  IF parent_row.id IS NULL OR parent_row.lifted_at IS NOT NULL
     OR actual_college IS DISTINCT FROM parent_row.college_id THEN
    RAISE EXCEPTION 'Debarment job/college or lifted state invalid' USING ERRCODE='23514';
  END IF;
  SELECT EXISTS (
    SELECT 1 FROM placement_applications a WHERE a.job_id=NEW.job_id
      AND a.membership_id=parent_row.membership_id
  ) INTO participant;
  IF NOT participant THEN
    RAISE EXCEPTION 'Learner has no application for counted drive' USING ERRCODE='23514';
  END IF;
  UPDATE placement_debarments
    SET drives_counted=drives_counted+1 WHERE id=NEW.debarment_id;
  INSERT INTO placement_debarment_history
    (debarment_id,event_type,job_id,actor_user_id)
    VALUES (NEW.debarment_id,'DRIVE_COUNTED',NEW.job_id,NEW.recorded_by_user_id);
  RETURN NEW;
END;
$$;
CREATE TRIGGER db08_debarment_drive_count
  AFTER INSERT ON placement_debarment_drive_events
  FOR EACH ROW EXECUTE FUNCTION db08_debarment_count_drive();

CREATE FUNCTION db08_debarment_events_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Debarment history is append-only' USING ERRCODE='23514';
END;
$$;
CREATE TRIGGER db08_debarment_history_no_mutation
  BEFORE UPDATE OR DELETE ON placement_debarment_history
  FOR EACH ROW EXECUTE FUNCTION db08_debarment_events_immutable();
CREATE TRIGGER db08_debarment_drive_events_no_mutation
  BEFORE UPDATE OR DELETE ON placement_debarment_drive_events
  FOR EACH ROW EXECUTE FUNCTION db08_debarment_events_immutable();

-- P0 blockers: DB triggers must also prevent manual drives_counted mutation,
-- unauthorized actor writes, parent-side college move, and retroactive insertion
-- after expiry; service-level checks do not replace full database permission policy.
