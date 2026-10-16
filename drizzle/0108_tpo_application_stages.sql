CREATE TABLE "placement_tpo_application_stages" (
	"application_id" uuid PRIMARY KEY NOT NULL,
	"job_id" uuid NOT NULL,
	"round_id" uuid NOT NULL,
	"stage" varchar(20) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"changed_by_user_id" uuid NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_tpo_application_stage_kind_ck" CHECK ("placement_tpo_application_stages"."stage" in ('TEST','INTERVIEW')),
	CONSTRAINT "placement_tpo_application_stage_version_ck" CHECK ("placement_tpo_application_stages"."version" >= 1)
);
--> statement-breakpoint
ALTER TABLE "placement_tpo_application_stages" ADD CONSTRAINT "placement_tpo_application_stages_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_application_stages" ADD CONSTRAINT "placement_tpo_application_stage_application_fk" FOREIGN KEY ("application_id","job_id") REFERENCES "public"."placement_applications"("id","job_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_application_stages" ADD CONSTRAINT "placement_tpo_application_stage_round_fk" FOREIGN KEY ("round_id","job_id") REFERENCES "public"."placement_job_rounds"("id","job_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_application_stages" ADD CONSTRAINT "placement_tpo_application_stage_job_fk" FOREIGN KEY ("job_id") REFERENCES "public"."placement_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "placement_tpo_application_stage_job_idx" ON "placement_tpo_application_stages" USING btree ("job_id","stage");