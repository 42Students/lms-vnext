ALTER TABLE "placement_jobs" DROP CONSTRAINT "placement_jobs_external_url_ck";--> statement-breakpoint
CREATE TABLE "placement_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"channel" varchar(16) NOT NULL,
	"status" varchar(24) DEFAULT 'SUBMITTED' NOT NULL,
	"eligibility_status" varchar(40) NOT NULL,
	"eligibility_snapshot" jsonb NOT NULL,
	"submitted_by_user_id" uuid NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"withdrawn_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_applications_channel_ck" CHECK ("placement_applications"."channel" in ('INTERNAL', 'EXTERNAL')),
	CONSTRAINT "placement_applications_status_ck" CHECK ("placement_applications"."status" in ('SUBMITTED', 'WITHDRAWN')),
	CONSTRAINT "placement_applications_eligibility_status_ck" CHECK ("placement_applications"."eligibility_status" in ('ELIGIBLE', 'ELIGIBLE_WITH_MISSING_EVIDENCE')),
	CONSTRAINT "placement_applications_lifecycle_ck" CHECK (("placement_applications"."status" = 'SUBMITTED' and "placement_applications"."withdrawn_at" is null)
        or ("placement_applications"."status" = 'WITHDRAWN' and "placement_applications"."withdrawn_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "placement_applications" ADD CONSTRAINT "placement_applications_job_id_placement_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."placement_jobs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_applications" ADD CONSTRAINT "placement_applications_membership_id_college_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_applications" ADD CONSTRAINT "placement_applications_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "placement_applications_job_membership_uq" ON "placement_applications" USING btree ("job_id","membership_id");--> statement-breakpoint
CREATE INDEX "placement_applications_job_status_idx" ON "placement_applications" USING btree ("job_id","status");--> statement-breakpoint
CREATE INDEX "placement_applications_membership_status_idx" ON "placement_applications" USING btree ("membership_id","status");--> statement-breakpoint
ALTER TABLE "placement_jobs" ADD CONSTRAINT "placement_jobs_external_url_ck" CHECK (("placement_jobs"."application_mode" = 'INTERNAL') or ("placement_jobs"."external_application_url" is not null));
