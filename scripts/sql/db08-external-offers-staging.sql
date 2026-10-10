-- W04 DB08-C: external verified offers and saved jobs.
-- STAGING DRAFT ONLY. W01 owns Drizzle journal, schema barrel and full replay.
-- The service never creates fake placement_jobs/applications/offers for outside offers.
CREATE TABLE placement_external_offers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 membership_id uuid NOT NULL REFERENCES college_memberships(id) ON DELETE RESTRICT,
 company_name varchar(200) NOT NULL,
 ctc_lpa numeric(10,2),
 private_letter_object_path text,
 submitted_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 status varchar(24) NOT NULL DEFAULT 'SUBMITTED',
 reviewed_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
 reviewed_at timestamptz,
 review_reason varchar(500),
 revoked_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
 revoked_at timestamptz,
 revoke_reason varchar(500),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT placement_external_offers_name_ck CHECK (length(trim(company_name))>0),
 CONSTRAINT placement_external_offers_ctc_ck CHECK (ctc_lpa IS NULL OR ctc_lpa >= 0),
 CONSTRAINT placement_external_offers_status_ck CHECK (status IN ('SUBMITTED','VERIFIED','REJECTED','REVOKED')),
 CONSTRAINT placement_external_offers_review_ck CHECK (
   (status='SUBMITTED' AND reviewed_at IS NULL AND reviewed_by_user_id IS NULL
      AND revoked_at IS NULL AND revoked_by_user_id IS NULL)
   OR (status IN ('VERIFIED','REJECTED') AND reviewed_at IS NOT NULL
     AND reviewed_by_user_id IS NOT NULL AND revoked_at IS NULL AND revoked_by_user_id IS NULL)
   OR (status='REVOKED' AND reviewed_at IS NOT NULL AND reviewed_by_user_id IS NOT NULL
     AND revoked_at IS NOT NULL AND revoked_by_user_id IS NOT NULL)
 ),
 CONSTRAINT placement_external_offers_revoke_reason_ck CHECK (
   status <> 'REVOKED' OR length(trim(coalesce(revoke_reason,'')))>0)
);
CREATE INDEX placement_external_offers_college_status_idx ON placement_external_offers(college_id,status);
CREATE INDEX placement_external_offers_member_status_idx ON placement_external_offers(membership_id,status);

CREATE TABLE placement_external_offer_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 offer_id uuid NOT NULL REFERENCES placement_external_offers(id) ON DELETE RESTRICT,
 prior_status varchar(24),
 next_status varchar(24) NOT NULL,
 actor_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 reason varchar(500),
 occurred_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT placement_external_offer_events_status_ck
   CHECK (next_status IN ('SUBMITTED','VERIFIED','REJECTED','REVOKED'))
);
CREATE INDEX placement_external_offer_events_offer_idx ON placement_external_offer_events(offer_id,occurred_at);

CREATE TABLE placement_saved_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 membership_id uuid NOT NULL REFERENCES college_memberships(id) ON DELETE RESTRICT,
 job_id uuid NOT NULL REFERENCES placement_jobs(id) ON DELETE RESTRICT,
 saved_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX placement_saved_jobs_member_job_uq ON placement_saved_jobs(membership_id,job_id);
CREATE INDEX placement_saved_jobs_college_idx ON placement_saved_jobs(college_id,membership_id);

CREATE FUNCTION db08_external_offer_parent_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE real_college uuid; real_submitter uuid;
BEGIN
 SELECT m.college_id,m.user_id INTO real_college,real_submitter
 FROM college_memberships m JOIN membership_roles r ON r.membership_id=m.id
 WHERE m.id=NEW.membership_id AND r.role='LEARNER' LIMIT 1;
 IF real_college IS DISTINCT FROM NEW.college_id THEN
  RAISE EXCEPTION 'External placement learner/college mismatch' USING ERRCODE='23514';
 END IF;
 IF real_submitter IS DISTINCT FROM NEW.submitted_by_user_id THEN
  RAISE EXCEPTION 'External offer submitted by wrong learner' USING ERRCODE='23514';
 END IF;
 IF TG_OP='UPDATE' THEN
   IF OLD.college_id IS DISTINCT FROM NEW.college_id
     OR OLD.membership_id IS DISTINCT FROM NEW.membership_id
     OR OLD.submitted_by_user_id IS DISTINCT FROM NEW.submitted_by_user_id
     OR OLD.company_name IS DISTINCT FROM NEW.company_name
     OR OLD.ctc_lpa IS DISTINCT FROM NEW.ctc_lpa THEN
       RAISE EXCEPTION 'External offer identity/compensation is immutable' USING ERRCODE='23514';
   END IF;
   IF NOT ((OLD.status='SUBMITTED' AND NEW.status IN ('VERIFIED','REJECTED'))
           OR (OLD.status='VERIFIED' AND NEW.status='REVOKED')
           OR (OLD.status=NEW.status)) THEN
       RAISE EXCEPTION 'External offer invalid state change' USING ERRCODE='23514';
   END IF;
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER db08_external_offer_parent_guard_trigger
 BEFORE INSERT OR UPDATE ON placement_external_offers
 FOR EACH ROW EXECUTE FUNCTION db08_external_offer_parent_guard();

CREATE FUNCTION db08_saved_job_college_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE member_college uuid; job_college uuid;
BEGIN
 SELECT college_id INTO member_college FROM college_memberships WHERE id=NEW.membership_id;
 SELECT college_id INTO job_college FROM placement_jobs WHERE id=NEW.job_id;
 IF member_college IS DISTINCT FROM NEW.college_id OR job_college IS DISTINCT FROM NEW.college_id THEN
  RAISE EXCEPTION 'Saved job does not share learner college' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER db08_saved_job_college_guard_trigger
 BEFORE INSERT OR UPDATE ON placement_saved_jobs
 FOR EACH ROW EXECUTE FUNCTION db08_saved_job_college_guard();

CREATE FUNCTION db08_external_offer_events_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 RAISE EXCEPTION 'External offer audit events are immutable' USING ERRCODE='23514';
END;
$$;
CREATE TRIGGER db08_external_offer_events_no_mutation
 BEFORE DELETE OR UPDATE ON placement_external_offer_events
 FOR EACH ROW EXECUTE FUNCTION db08_external_offer_events_immutable();

-- P0 gate: protect parent-side college moves, require mandatory matching
-- audit event per state change even for direct SQL privileged writers, and
-- check manager reviewer belongs to college and has TPO/admin role.
-- P0 gate: allow offer letter attachment only via trusted private storage
-- signed-receipt contract; service currently accepts no file path from input.
-- NOTE: no route should call these tables before W01-generated official
-- Drizzle snapshot/journal and isolated database negative tests pass.
