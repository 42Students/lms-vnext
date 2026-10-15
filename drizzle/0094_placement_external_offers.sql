CREATE TABLE "placement_external_offer_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offer_id" uuid NOT NULL,
	"prior_status" varchar(24),
	"next_status" varchar(24) NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"reason" varchar(500),
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_external_offer_events_status_ck" CHECK ("placement_external_offer_events"."next_status" in ('SUBMITTED','VERIFIED','REJECTED','REVOKED'))
);
--> statement-breakpoint
CREATE TABLE "placement_external_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"company_name" varchar(200) NOT NULL,
	"ctc_lpa" numeric(10, 2),
	"private_letter_object_path" text,
	"submitted_by_user_id" uuid NOT NULL,
	"status" varchar(24) DEFAULT 'SUBMITTED' NOT NULL,
	"reviewed_by_user_id" uuid,
	"reviewed_at" timestamp with time zone,
	"review_reason" varchar(500),
	"revoked_by_user_id" uuid,
	"revoked_at" timestamp with time zone,
	"revoke_reason" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_external_offers_company_name_ck" CHECK (length(trim("placement_external_offers"."company_name")) > 0),
	CONSTRAINT "placement_external_offers_ctc_ck" CHECK ("placement_external_offers"."ctc_lpa" is null or "placement_external_offers"."ctc_lpa" >= 0),
	CONSTRAINT "placement_external_offers_status_ck" CHECK ("placement_external_offers"."status" in ('SUBMITTED','VERIFIED','REJECTED','REVOKED')),
	CONSTRAINT "placement_external_offers_verified_ck" CHECK (("placement_external_offers"."status" = 'SUBMITTED' and "placement_external_offers"."reviewed_by_user_id" is null and "placement_external_offers"."reviewed_at" is null
        and "placement_external_offers"."revoked_by_user_id" is null and "placement_external_offers"."revoked_at" is null)
        or ("placement_external_offers"."status" in ('VERIFIED','REJECTED') and "placement_external_offers"."reviewed_by_user_id" is not null
          and "placement_external_offers"."reviewed_at" is not null and "placement_external_offers"."revoked_by_user_id" is null and "placement_external_offers"."revoked_at" is null)
        or ("placement_external_offers"."status" = 'REVOKED' and "placement_external_offers"."reviewed_by_user_id" is not null
          and "placement_external_offers"."reviewed_at" is not null and "placement_external_offers"."revoked_by_user_id" is not null
          and "placement_external_offers"."revoked_at" is not null)),
	CONSTRAINT "placement_external_offers_revoke_reason_ck" CHECK ("placement_external_offers"."status" <> 'REVOKED' or length(trim(coalesce("placement_external_offers"."revoke_reason",''))) > 0)
);
--> statement-breakpoint
CREATE TABLE "placement_saved_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "placement_external_offer_events" ADD CONSTRAINT "placement_external_offer_events_offer_id_placement_external_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."placement_external_offers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_external_offer_events" ADD CONSTRAINT "placement_external_offer_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_external_offers" ADD CONSTRAINT "placement_external_offers_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_external_offers" ADD CONSTRAINT "placement_external_offers_membership_id_college_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_external_offers" ADD CONSTRAINT "placement_external_offers_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_external_offers" ADD CONSTRAINT "placement_external_offers_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_external_offers" ADD CONSTRAINT "placement_external_offers_revoked_by_user_id_users_id_fk" FOREIGN KEY ("revoked_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_saved_jobs" ADD CONSTRAINT "placement_saved_jobs_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_saved_jobs" ADD CONSTRAINT "placement_saved_jobs_membership_id_college_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_saved_jobs" ADD CONSTRAINT "placement_saved_jobs_job_id_placement_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."placement_jobs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "placement_external_offer_events_offer_idx" ON "placement_external_offer_events" USING btree ("offer_id","occurred_at");--> statement-breakpoint
CREATE INDEX "placement_external_offers_college_status_idx" ON "placement_external_offers" USING btree ("college_id","status");--> statement-breakpoint
CREATE INDEX "placement_external_offers_member_status_idx" ON "placement_external_offers" USING btree ("membership_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "placement_saved_jobs_member_job_uq" ON "placement_saved_jobs" USING btree ("membership_id","job_id");--> statement-breakpoint
CREATE INDEX "placement_saved_jobs_college_idx" ON "placement_saved_jobs" USING btree ("college_id","membership_id");--> statement-breakpoint
CREATE OR REPLACE FUNCTION db08_external_offer_parent_guard() RETURNS trigger LANGUAGE plpgsql AS $$
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
--> statement-breakpoint
CREATE TRIGGER db08_external_offer_parent_guard_trigger
 BEFORE INSERT OR UPDATE ON placement_external_offers
 FOR EACH ROW EXECUTE FUNCTION db08_external_offer_parent_guard();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION db08_saved_job_college_guard() RETURNS trigger LANGUAGE plpgsql AS $$
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
--> statement-breakpoint
CREATE TRIGGER db08_saved_job_college_guard_trigger
 BEFORE INSERT OR UPDATE ON placement_saved_jobs
 FOR EACH ROW EXECUTE FUNCTION db08_saved_job_college_guard();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION db08_external_offer_events_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 RAISE EXCEPTION 'External offer audit events are immutable' USING ERRCODE='23514';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER db08_external_offer_events_no_mutation
 BEFORE DELETE OR UPDATE ON placement_external_offer_events
 FOR EACH ROW EXECUTE FUNCTION db08_external_offer_events_immutable();
