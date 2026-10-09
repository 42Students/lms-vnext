-- DB08-B STAGING DRAFT ONLY. Not part of Drizzle journal and NOT deployable.
-- Integrate after DB03/DB04 and DB08-A generated migration reconciliation.
-- Depends on placement_batch_lifecycles from DB08-A; never apply to shared DB.
CREATE TABLE "placement_batch_registrations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "college_id" uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  "cohort_id" uuid NOT NULL REFERENCES cohorts(id) ON DELETE RESTRICT,
  "membership_id" uuid NOT NULL REFERENCES college_memberships(id) ON DELETE RESTRICT,
  "choice" varchar(24) NOT NULL,
  "consent_version" varchar(32),
  "consent_at" timestamptz,
  "source" varchar(16) NOT NULL,
  "recorded_by_user_id" uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  "version" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "placement_batch_registrations_choice_ck" CHECK (
    choice IN ('PLACEMENTS','HIGHER_STUDIES','NOT_INTERESTED','ENTREPRENEURSHIP','COMPETITIVE_EXAMS')
  ),
  CONSTRAINT "placement_batch_registrations_source_ck" CHECK (source IN ('SELF','TPO','BACKFILL')),
  CONSTRAINT "placement_batch_registrations_consent_ck" CHECK (
    (choice = 'PLACEMENTS' AND consent_at IS NOT NULL
       AND length(trim(coalesce(consent_version,''))) > 0)
    OR (choice <> 'PLACEMENTS' AND consent_at IS NULL AND consent_version IS NULL)
  ),
  CONSTRAINT "placement_batch_registrations_version_ck" CHECK (version >= 0)
);
CREATE UNIQUE INDEX "placement_batch_registrations_member_cohort_uq"
  ON placement_batch_registrations (membership_id, cohort_id);
CREATE INDEX "placement_batch_registrations_college_cohort_idx"
  ON placement_batch_registrations (college_id, cohort_id, choice);

CREATE TABLE "placement_batch_registration_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "registration_id" uuid NOT NULL REFERENCES placement_batch_registrations(id) ON DELETE RESTRICT,
  "previous_choice" varchar(24),
  "next_choice" varchar(24) NOT NULL,
  "consent_version" varchar(32),
  "consent_at" timestamptz,
  "actor_user_id" uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  "source" varchar(16) NOT NULL,
  "occurred_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "placement_batch_registration_events_source_ck"
    CHECK (source IN ('SELF','TPO','BACKFILL')),
  CONSTRAINT "placement_batch_registration_events_consent_ck" CHECK (
    (next_choice = 'PLACEMENTS' AND consent_at IS NOT NULL
       AND length(trim(coalesce(consent_version,''))) > 0)
    OR (next_choice <> 'PLACEMENTS' AND consent_at IS NULL AND consent_version IS NULL)
  )
);
CREATE INDEX "placement_batch_registration_events_registration_time_idx"
  ON placement_batch_registration_events (registration_id,occurred_at);

-- No cross-tenant/mismatched-cohort registration, even with individually valid FKs.
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
  IF NEW.source='SELF' AND NOT actor_matches THEN
    RAISE EXCEPTION 'Self registration cannot impersonate another learner' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER db08_registration_parent_guard
  BEFORE INSERT OR UPDATE ON placement_batch_registrations
  FOR EACH ROW EXECUTE FUNCTION db08_assert_registration_parent();

-- Protect append-only audit. Changes to current state MUST retain events.
CREATE FUNCTION db08_registration_events_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Registration history is immutable' USING ERRCODE='23514';
END;
$$;
CREATE TRIGGER db08_registration_events_no_mutation
  BEFORE UPDATE OR DELETE ON placement_batch_registration_events
  FOR EACH ROW EXECUTE FUNCTION db08_registration_events_immutable();

-- TODO gate: protect against direct SQL registration without an event, including
-- admins and backfills, via privileged DB writer boundary or transactional trigger.
-- TODO gate: guard parent cohort/college reparenting and cross-college schema drift.
-- TODO gate: generate official Drizzle snapshot/journal + disposable PG replay.
