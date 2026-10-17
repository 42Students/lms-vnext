CREATE TABLE "placement_college_interviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"round_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"duration_minutes" integer NOT NULL,
	"mode" varchar(24) NOT NULL,
	"venue" text,
	"meeting_url" text,
	"interviewer" text,
	"status" varchar(24) DEFAULT 'SCHEDULED' NOT NULL,
	"outcome_note" text,
	"created_by_user_id" uuid NOT NULL,
	"updated_by_user_id" uuid NOT NULL,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "college_interview_status_ck" CHECK ("placement_college_interviews"."status" in ('SCHEDULED','COMPLETED','NO_SHOW','CANCELLED')),
	CONSTRAINT "college_interview_mode_ck" CHECK ("placement_college_interviews"."mode" in ('ON_CAMPUS','VIRTUAL')),
	CONSTRAINT "college_interview_duration_ck" CHECK ("placement_college_interviews"."duration_minutes" between 5 and 480),
	CONSTRAINT "college_interview_version_ck" CHECK ("placement_college_interviews"."version">0),
	CONSTRAINT "college_interview_location_ck" CHECK (("placement_college_interviews"."mode"='ON_CAMPUS' and length(trim(coalesce("placement_college_interviews"."venue",'')))>=2) or
   ("placement_college_interviews"."mode"='VIRTUAL' and length(trim(coalesce("placement_college_interviews"."meeting_url",'')))>=8)),
	CONSTRAINT "college_interview_lifecycle_ck" CHECK (("placement_college_interviews"."status"='SCHEDULED' and "placement_college_interviews"."completed_at" is null and "placement_college_interviews"."cancelled_at" is null) or
   ("placement_college_interviews"."status" in ('COMPLETED','NO_SHOW') and "placement_college_interviews"."completed_at" is not null and "placement_college_interviews"."cancelled_at" is null) or
   ("placement_college_interviews"."status"='CANCELLED' and "placement_college_interviews"."cancelled_at" is not null and "placement_college_interviews"."completed_at" is null))
);
--> statement-breakpoint
ALTER TABLE "placement_college_interviews" ADD CONSTRAINT "placement_college_interviews_job_id_placement_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."placement_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_college_interviews" ADD CONSTRAINT "placement_college_interviews_round_id_placement_job_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."placement_job_rounds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_college_interviews" ADD CONSTRAINT "placement_college_interviews_application_id_placement_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."placement_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_college_interviews" ADD CONSTRAINT "placement_college_interviews_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_college_interviews" ADD CONSTRAINT "placement_college_interviews_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_college_interviews" ADD CONSTRAINT "college_interview_round_job_fk" FOREIGN KEY ("round_id","job_id") REFERENCES "public"."placement_job_rounds"("id","job_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "college_interview_active_application_round_uq" ON "placement_college_interviews" USING btree ("round_id","application_id") WHERE "placement_college_interviews"."status" <> 'CANCELLED';--> statement-breakpoint
CREATE INDEX "college_interview_job_time_idx" ON "placement_college_interviews" USING btree ("job_id","scheduled_at");