CREATE TABLE "placement_recruiter_drive_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"company_relationship_id" uuid NOT NULL,
	"recruiter_user_id" uuid NOT NULL,
	"submission_id" uuid NOT NULL,
	"source_job_id" uuid,
	"approved_job_id" uuid,
	"status" varchar(24) DEFAULT 'REQUEST' NOT NULL,
	"draft" jsonb NOT NULL,
	"decision_note" text,
	"decided_by_user_id" uuid,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_recruiter_drive_requests_status_ck" CHECK ("placement_recruiter_drive_requests"."status" in ('REQUEST','SENT_BACK','DRAFT','REJECTED','CANCELLED')),
	CONSTRAINT "placement_recruiter_drive_requests_decision_ck" CHECK (("placement_recruiter_drive_requests"."decided_at" is null) = ("placement_recruiter_drive_requests"."decided_by_user_id" is null)),
	CONSTRAINT "placement_recruiter_drive_requests_draft_ck" CHECK (jsonb_typeof("placement_recruiter_drive_requests"."draft") = 'object')
);
--> statement-breakpoint
ALTER TABLE "placement_recruiter_drive_requests" ADD CONSTRAINT "placement_recruiter_drive_requests_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_recruiter_drive_requests" ADD CONSTRAINT "placement_recruiter_drive_requests_recruiter_user_id_users_id_fk" FOREIGN KEY ("recruiter_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_recruiter_drive_requests" ADD CONSTRAINT "placement_recruiter_drive_requests_decided_by_user_id_users_id_fk" FOREIGN KEY ("decided_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_recruiter_drive_requests" ADD CONSTRAINT "placement_recruiter_drive_requests_relationship_fk" FOREIGN KEY ("company_relationship_id","college_id") REFERENCES "public"."placement_company_relationships"("id","college_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_recruiter_drive_requests" ADD CONSTRAINT "placement_recruiter_drive_requests_source_job_fk" FOREIGN KEY ("source_job_id","college_id") REFERENCES "public"."placement_jobs"("id","college_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_recruiter_drive_requests" ADD CONSTRAINT "placement_recruiter_drive_requests_approved_job_fk" FOREIGN KEY ("approved_job_id","college_id") REFERENCES "public"."placement_jobs"("id","college_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "placement_recruiter_drive_requests_nonce_uq" ON "placement_recruiter_drive_requests" USING btree ("recruiter_user_id","college_id","submission_id");--> statement-breakpoint
CREATE INDEX "placement_recruiter_drive_requests_tpo_inbox_idx" ON "placement_recruiter_drive_requests" USING btree ("college_id","status","created_at");--> statement-breakpoint
CREATE INDEX "placement_recruiter_drive_requests_own_idx" ON "placement_recruiter_drive_requests" USING btree ("recruiter_user_id","college_id","created_at");