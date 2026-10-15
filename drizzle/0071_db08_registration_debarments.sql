CREATE TABLE "placement_batch_registration_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"previous_choice" varchar(24),
	"next_choice" varchar(24) NOT NULL,
	"consent_version" varchar(32),
	"consent_at" timestamp with time zone,
	"actor_user_id" uuid NOT NULL,
	"source" varchar(16) NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_batch_registration_events_source_ck" CHECK ("placement_batch_registration_events"."source" in ('SELF','TPO','BACKFILL')),
	CONSTRAINT "placement_batch_registration_events_consent_ck" CHECK (("placement_batch_registration_events"."next_choice" = 'PLACEMENTS' and "placement_batch_registration_events"."consent_at" is not null
           and length(trim(coalesce("placement_batch_registration_events"."consent_version", ''))) > 0)
        or ("placement_batch_registration_events"."next_choice" <> 'PLACEMENTS' and "placement_batch_registration_events"."consent_at" is null
           and "placement_batch_registration_events"."consent_version" is null))
);
--> statement-breakpoint
CREATE TABLE "placement_batch_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"cohort_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"choice" varchar(24) NOT NULL,
	"consent_version" varchar(32),
	"consent_at" timestamp with time zone,
	"source" varchar(16) NOT NULL,
	"recorded_by_user_id" uuid NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_batch_registrations_choice_ck" CHECK ("placement_batch_registrations"."choice" in (
        'PLACEMENTS','HIGHER_STUDIES','NOT_INTERESTED',
        'ENTREPRENEURSHIP','COMPETITIVE_EXAMS')),
	CONSTRAINT "placement_batch_registrations_source_ck" CHECK ("placement_batch_registrations"."source" in ('SELF','TPO','BACKFILL')),
	CONSTRAINT "placement_batch_registrations_consent_ck" CHECK (("placement_batch_registrations"."choice" = 'PLACEMENTS' and "placement_batch_registrations"."consent_at" is not null
          and length(trim(coalesce("placement_batch_registrations"."consent_version", ''))) > 0)
        or ("placement_batch_registrations"."choice" <> 'PLACEMENTS' and "placement_batch_registrations"."consent_at" is null
          and "placement_batch_registrations"."consent_version" is null)),
	CONSTRAINT "placement_batch_registrations_version_ck" CHECK ("placement_batch_registrations"."version" >= 0)
);
--> statement-breakpoint
CREATE TABLE "placement_debarment_drive_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"debarment_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"recorded_by_user_id" uuid NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "placement_debarment_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"debarment_id" uuid NOT NULL,
	"event_type" varchar(24) NOT NULL,
	"job_id" uuid,
	"reason" varchar(500),
	"actor_user_id" uuid NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_debarment_history_type_ck" CHECK ("placement_debarment_history"."event_type" in ('CREATED','DRIVE_COUNTED','LIFTED')),
	CONSTRAINT "placement_debarment_history_job_ck" CHECK (("placement_debarment_history"."event_type" = 'DRIVE_COUNTED' and "placement_debarment_history"."job_id" is not null)
        or ("placement_debarment_history"."event_type" <> 'DRIVE_COUNTED' and "placement_debarment_history"."job_id" is null))
);
--> statement-breakpoint
CREATE TABLE "placement_debarments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"reason" varchar(500) NOT NULL,
	"until_date" date,
	"until_drives" integer,
	"drives_counted" integer DEFAULT 0 NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lifted_at" timestamp with time zone,
	"lifted_by_user_id" uuid,
	"lifted_reason" varchar(500),
	CONSTRAINT "placement_debarments_reason_ck" CHECK (length(trim("placement_debarments"."reason")) > 0),
	CONSTRAINT "placement_debarments_until_drives_ck" CHECK ("placement_debarments"."until_drives" is null or "placement_debarments"."until_drives" > 0),
	CONSTRAINT "placement_debarments_count_ck" CHECK ("placement_debarments"."drives_counted" >= 0),
	CONSTRAINT "placement_debarments_lift_ck" CHECK (("placement_debarments"."lifted_at" is null and "placement_debarments"."lifted_by_user_id" is null and "placement_debarments"."lifted_reason" is null)
        or ("placement_debarments"."lifted_at" is not null and "placement_debarments"."lifted_by_user_id" is not null
          and length(trim(coalesce("placement_debarments"."lifted_reason", ''))) > 0))
);
--> statement-breakpoint
ALTER TABLE "placement_batch_registration_events" ADD CONSTRAINT "placement_batch_registration_events_registration_id_placement_batch_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."placement_batch_registrations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_batch_registration_events" ADD CONSTRAINT "placement_batch_registration_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_batch_registrations" ADD CONSTRAINT "placement_batch_registrations_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_batch_registrations" ADD CONSTRAINT "placement_batch_registrations_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "public"."cohorts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_batch_registrations" ADD CONSTRAINT "placement_batch_registrations_membership_id_college_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_batch_registrations" ADD CONSTRAINT "placement_batch_registrations_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_debarment_drive_events" ADD CONSTRAINT "placement_debarment_drive_events_debarment_id_placement_debarments_id_fk" FOREIGN KEY ("debarment_id") REFERENCES "public"."placement_debarments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_debarment_drive_events" ADD CONSTRAINT "placement_debarment_drive_events_job_id_placement_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."placement_jobs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_debarment_drive_events" ADD CONSTRAINT "placement_debarment_drive_events_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_debarment_history" ADD CONSTRAINT "placement_debarment_history_debarment_id_placement_debarments_id_fk" FOREIGN KEY ("debarment_id") REFERENCES "public"."placement_debarments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_debarment_history" ADD CONSTRAINT "placement_debarment_history_job_id_placement_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."placement_jobs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_debarment_history" ADD CONSTRAINT "placement_debarment_history_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_debarments" ADD CONSTRAINT "placement_debarments_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_debarments" ADD CONSTRAINT "placement_debarments_membership_id_college_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_debarments" ADD CONSTRAINT "placement_debarments_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_debarments" ADD CONSTRAINT "placement_debarments_lifted_by_user_id_users_id_fk" FOREIGN KEY ("lifted_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "placement_batch_registration_events_registration_time_idx" ON "placement_batch_registration_events" USING btree ("registration_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "placement_batch_registrations_member_cohort_uq" ON "placement_batch_registrations" USING btree ("membership_id","cohort_id");--> statement-breakpoint
CREATE INDEX "placement_batch_registrations_college_cohort_idx" ON "placement_batch_registrations" USING btree ("college_id","cohort_id","choice");--> statement-breakpoint
CREATE UNIQUE INDEX "placement_debarment_drives_unique_uq" ON "placement_debarment_drive_events" USING btree ("debarment_id","job_id");--> statement-breakpoint
CREATE INDEX "placement_debarment_drives_job_idx" ON "placement_debarment_drive_events" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "placement_debarment_history_parent_time_idx" ON "placement_debarment_history" USING btree ("debarment_id","occurred_at");--> statement-breakpoint
CREATE INDEX "placement_debarments_member_time_idx" ON "placement_debarments" USING btree ("membership_id","created_at");--> statement-breakpoint
CREATE INDEX "placement_debarments_college_idx" ON "placement_debarments" USING btree ("college_id","lifted_at");
--> statement-breakpoint
-- No cross-tenant/mismatched-cohort registration, even with individually valid FKs.
--> statement-breakpoint
CREATE FUNCTION db08_assert_registration_parent() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE owner_college uuid; enrolled boolean; actor_matches boolean;
BEGIN
  SELECT m.college_id, m.user_id = NEW.recorded_by_user_id
    INTO owner_college, actor_matches
    FROM college_memberships m
    WHERE m.id = NEW.membership_id;
  IF owner_college IS DISTINCT FROM NEW.college_id THEN
    RAISE EXCEPTION 'Registration membership and college mismatch' USING ERRCODE='23514';
  END IF;
  SELECT EXISTS (
    SELECT 1 FROM learner_program_enrollments le
    JOIN cohorts c ON c.id=le.cohort_id AND c.program_id=le.program_id
    JOIN programs p ON p.id=c.program_id
    JOIN departments d ON d.id=p.department_id
    JOIN membership_roles mr ON mr.membership_id=le.membership_id AND mr.role='LEARNER'
    WHERE le.membership_id=NEW.membership_id
      AND le.cohort_id=NEW.cohort_id
      AND d.college_id=NEW.college_id
  ) INTO enrolled;
  IF NOT enrolled THEN
    RAISE EXCEPTION 'Registration cohort is not owned by learner college' USING ERRCODE='23514';
  END IF;
  IF NEW.source='SELF' THEN
    IF NOT actor_matches THEN
      RAISE EXCEPTION 'Self registration cannot impersonate another learner' USING ERRCODE='23514';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM placement_batch_lifecycles b
      WHERE b.cohort_id=NEW.cohort_id AND b.college_id=NEW.college_id
        AND b.invited_at IS NOT NULL AND b.finished_at IS NULL
        AND (b.registration_deadline IS NULL OR b.registration_deadline > now())
    ) THEN
      RAISE EXCEPTION 'Registration window closed for learner self service' USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER db08_registration_parent_guard
  BEFORE INSERT OR UPDATE ON placement_batch_registrations
  FOR EACH ROW EXECUTE FUNCTION db08_assert_registration_parent();
--> statement-breakpoint
-- Database-owned audit: even an authorized future SQL writer cannot change a
--> statement-breakpoint
-- choice or consent without an immutable versioned event. No service duplicate.
--> statement-breakpoint
CREATE FUNCTION db08_register_audit() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE prior_choice varchar(24);
BEGIN
  IF TG_OP='UPDATE' THEN
    prior_choice := OLD.choice;
    IF (OLD.choice,OLD.consent_version,OLD.consent_at,OLD.source)
         IS NOT DISTINCT FROM
       (NEW.choice,NEW.consent_version,NEW.consent_at,NEW.source) THEN
      RETURN NEW;
    END IF;
  END IF;
  INSERT INTO placement_batch_registration_events
    (registration_id,previous_choice,next_choice,consent_version,consent_at,actor_user_id,source)
  VALUES (NEW.id,prior_choice,NEW.choice,NEW.consent_version,
    NEW.consent_at,NEW.recorded_by_user_id,NEW.source);
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER db08_registration_auto_audit
  AFTER INSERT OR UPDATE ON placement_batch_registrations
  FOR EACH ROW EXECUTE FUNCTION db08_register_audit();
--> statement-breakpoint
-- Protect append-only audit. Changes to current state MUST retain events.
--> statement-breakpoint
CREATE FUNCTION db08_registration_events_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Registration history is immutable' USING ERRCODE='23514';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER db08_registration_events_no_mutation
  BEFORE UPDATE OR DELETE ON placement_batch_registration_events
  FOR EACH ROW EXECUTE FUNCTION db08_registration_events_immutable();

-- Source writer boundary still requires authenticated TPO/BACKFILL actor validation.
-- SQL guards enforce SELF identity and window; reserve the administrative source
-- mode for explicit server-side authorized services only.
-- TODO gate: guard parent cohort/college reparenting and cross-college schema drift.
-- TODO gate: generate official Drizzle snapshot/journal + disposable PG replay.
--> statement-breakpoint
-- A debarred learner's college and LEARNER role must be real.
--> statement-breakpoint
CREATE FUNCTION db08_validate_debarment_parent() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE actual_college uuid; actual_count bigint;
BEGIN
  SELECT count(*) INTO actual_count
    FROM placement_debarment_drive_events e WHERE e.debarment_id=NEW.id;
  IF NEW.drives_counted <> actual_count THEN
    RAISE EXCEPTION 'Debarment drive count must match immutable recorded drive events'
      USING ERRCODE='23514';
  END IF;
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
--> statement-breakpoint
CREATE TRIGGER db08_debarment_parent_guard
  BEFORE INSERT OR UPDATE ON placement_debarments
  FOR EACH ROW EXECUTE FUNCTION db08_validate_debarment_parent();
--> statement-breakpoint
-- The DB owns audit emission for all writers, including direct SQL.
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TRIGGER db08_debarment_auto_audit
  AFTER INSERT OR UPDATE ON placement_debarments
  FOR EACH ROW EXECUTE FUNCTION db08_debarment_audit();
--> statement-breakpoint
-- Every drive counter is an immutable (debarment,job) fact.
--> statement-breakpoint
-- The trigger checks the job is the college's and the student actually applied.
--> statement-breakpoint
-- It atomically increments drives_counted, then creates the durable event.
--> statement-breakpoint
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
  -- Legacy precedence: until_date overrides until_drives. Date is inclusive,
  -- and uses the legacy deployment's Indian calendar until college timezones
  -- are modeled explicitly.
  IF (parent_row.until_date IS NOT NULL AND
      (now() AT TIME ZONE 'Asia/Kolkata')::date > parent_row.until_date)
     OR (parent_row.until_date IS NULL AND parent_row.until_drives IS NOT NULL
       AND parent_row.drives_counted >= parent_row.until_drives) THEN
    RAISE EXCEPTION 'Debarment already expired for this drive' USING ERRCODE='23514';
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
--> statement-breakpoint
CREATE TRIGGER db08_debarment_drive_count
  AFTER INSERT ON placement_debarment_drive_events
  FOR EACH ROW EXECUTE FUNCTION db08_debarment_count_drive();
--> statement-breakpoint
CREATE FUNCTION db08_debarment_events_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Debarment history is append-only' USING ERRCODE='23514';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER db08_debarment_history_no_mutation
  BEFORE UPDATE OR DELETE ON placement_debarment_history
  FOR EACH ROW EXECUTE FUNCTION db08_debarment_events_immutable();
--> statement-breakpoint
CREATE TRIGGER db08_debarment_drive_events_no_mutation
  BEFORE UPDATE OR DELETE ON placement_debarment_drive_events
  FOR EACH ROW EXECUTE FUNCTION db08_debarment_events_immutable();

-- P0 blockers: DB session/writer grants must prevent unauthorized actor writes,
-- parent-side college reparenting requires a physical guard, and all college
-- timezones must become explicit. Source-only authoring is NOT PG validation.
