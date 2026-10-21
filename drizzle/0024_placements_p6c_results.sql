-- Old round-result BIGINT IDs and superseded_by links require a scoped UUID
-- crosswalk. Resolve an entire acyclic predecessor chain before activation,
-- preserving historical outcomes and dates; one version per round/application
-- may remain current. Superseded rows use status SUPERSEDED and source time.
-- Missing actor/time for APPLIED is an exception, not an invented timestamp.
CREATE TABLE "placement_round_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"outcome" varchar(24) NOT NULL,
	"waitlist_rank" integer,
	"score_percent" integer,
	"reason_category" varchar(32),
	"candidate_message" text,
	"internal_comment" text,
	"source" varchar(16) DEFAULT 'TPO' NOT NULL,
	"status" varchar(24) DEFAULT 'STAGED' NOT NULL,
	"submitted_by_user_id" uuid NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"applied_by_user_id" uuid,
	"applied_at" timestamp with time zone,
	"superseded_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_round_results_version_ck" CHECK ("placement_round_results"."version" > 0),
	CONSTRAINT "placement_round_results_outcome_ck" CHECK ("placement_round_results"."outcome" in ('PASS', 'FAIL', 'HOLD', 'ABSENT')),
	CONSTRAINT "placement_round_results_waitlist_ck" CHECK (("placement_round_results"."outcome" = 'HOLD'
          and "placement_round_results"."waitlist_rank" is not null
          and "placement_round_results"."waitlist_rank" > 0)
        or ("placement_round_results"."outcome" <> 'HOLD'
          and "placement_round_results"."waitlist_rank" is null)),
	CONSTRAINT "placement_round_results_score_ck" CHECK ("placement_round_results"."score_percent" is null
        or ("placement_round_results"."score_percent" >= 0 and "placement_round_results"."score_percent" <= 100)),
	CONSTRAINT "placement_round_results_reason_category_ck" CHECK ("placement_round_results"."reason_category" is null
        or "placement_round_results"."reason_category" in ('APTITUDE', 'TECHNICAL', 'COMMUNICATION', 'OTHER')),
	CONSTRAINT "placement_round_results_source_ck" CHECK ("placement_round_results"."source" in ('TPO', 'HR', 'IMPORT')),
	CONSTRAINT "placement_round_results_status_ck" CHECK ("placement_round_results"."status" in ('STAGED', 'APPLIED', 'SUPERSEDED')),
	CONSTRAINT "placement_round_results_candidate_message_ck" CHECK ("placement_round_results"."outcome" = 'PASS'
        or coalesce(length(trim("placement_round_results"."candidate_message")), 0) > 0),
	CONSTRAINT "placement_round_results_lifecycle_ck" CHECK (("placement_round_results"."status" = 'STAGED'
          and "placement_round_results"."applied_by_user_id" is null
          and "placement_round_results"."applied_at" is null
          and "placement_round_results"."superseded_at" is null)
        or ("placement_round_results"."status" = 'APPLIED'
          and "placement_round_results"."applied_by_user_id" is not null
          and "placement_round_results"."applied_at" is not null
          and "placement_round_results"."superseded_at" is null)
        or ("placement_round_results"."status" = 'SUPERSEDED'
          and "placement_round_results"."applied_by_user_id" is null
          and "placement_round_results"."applied_at" is null
          and "placement_round_results"."superseded_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "placement_round_results" ADD CONSTRAINT "placement_round_results_round_id_placement_job_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."placement_job_rounds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_round_results" ADD CONSTRAINT "placement_round_results_application_id_placement_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."placement_applications"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_round_results" ADD CONSTRAINT "placement_round_results_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_round_results" ADD CONSTRAINT "placement_round_results_applied_by_user_id_users_id_fk" FOREIGN KEY ("applied_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "placement_round_results_round_application_version_uq" ON "placement_round_results" USING btree ("round_id","application_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "placement_round_results_current_uq" ON "placement_round_results" USING btree ("round_id","application_id") WHERE "placement_round_results"."status" <> 'SUPERSEDED';--> statement-breakpoint
CREATE INDEX "placement_round_results_round_status_idx" ON "placement_round_results" USING btree ("round_id","status");--> statement-breakpoint
CREATE INDEX "placement_round_results_application_status_idx" ON "placement_round_results" USING btree ("application_id","status");
