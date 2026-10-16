CREATE TABLE "placement_college_application_stage_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stage_id" uuid NOT NULL,
	"from_stage" varchar(24),
	"to_stage" varchar(24) NOT NULL,
	"reason" text NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"moved_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_college_stage_history_reason_ck" CHECK (length(trim("placement_college_application_stage_history"."reason")) >= 3)
);
--> statement-breakpoint
CREATE TABLE "placement_college_application_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"stage" varchar(24) DEFAULT 'APPLIED' NOT NULL,
	"previous_stage" varchar(24),
	"version" integer DEFAULT 1 NOT NULL,
	"moved_by_user_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"moved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_college_stages_stage_ck" CHECK ("placement_college_application_stages"."stage" in ('APPLIED','SHORTLISTED','ASSESSMENT','INTERVIEW','WAITLISTED','OFFERED','HIRED','REJECTED')),
	CONSTRAINT "placement_college_stages_previous_ck" CHECK ("placement_college_application_stages"."previous_stage" is null or "placement_college_application_stages"."previous_stage" in ('APPLIED','SHORTLISTED','ASSESSMENT','INTERVIEW','WAITLISTED','OFFERED','HIRED','REJECTED')),
	CONSTRAINT "placement_college_stages_version_ck" CHECK ("placement_college_application_stages"."version" >= 1),
	CONSTRAINT "placement_college_stages_reason_ck" CHECK (length(trim("placement_college_application_stages"."reason")) >= 3)
);
--> statement-breakpoint
ALTER TABLE "placement_college_application_stage_history" ADD CONSTRAINT "placement_college_application_stage_history_stage_id_placement_college_application_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."placement_college_application_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_college_application_stage_history" ADD CONSTRAINT "placement_college_application_stage_history_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_college_application_stages" ADD CONSTRAINT "placement_college_application_stages_job_id_placement_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."placement_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_college_application_stages" ADD CONSTRAINT "placement_college_application_stages_application_id_placement_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."placement_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_college_application_stages" ADD CONSTRAINT "placement_college_application_stages_moved_by_user_id_users_id_fk" FOREIGN KEY ("moved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "placement_college_stage_history_stage_time_idx" ON "placement_college_application_stage_history" USING btree ("stage_id","moved_at");--> statement-breakpoint
CREATE UNIQUE INDEX "placement_college_stages_application_uq" ON "placement_college_application_stages" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "placement_college_stages_job_stage_idx" ON "placement_college_application_stages" USING btree ("job_id","stage");