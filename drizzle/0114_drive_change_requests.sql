CREATE TABLE "placement_drive_change_request_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"sender_user_id" uuid NOT NULL,
	"sender_party" varchar(12) NOT NULL,
	"body" text NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_drive_change_messages_party_ck" CHECK ("placement_drive_change_request_messages"."sender_party" in ('TPO','COMPANY')),
	CONSTRAINT "placement_drive_change_messages_body_ck" CHECK (length(trim("placement_drive_change_request_messages"."body")) between 1 and 2000)
);
--> statement-breakpoint
CREATE TABLE "placement_drive_change_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"proposer_party" varchar(12) NOT NULL,
	"target_party" varchar(12) NOT NULL,
	"mode" varchar(12) NOT NULL,
	"field" varchar(32) NOT NULL,
	"proposed_value" text NOT NULL,
	"reason" text NOT NULL,
	"status" varchar(16) DEFAULT 'OPEN' NOT NULL,
	"decision_note" text,
	"decided_by_user_id" uuid,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_drive_changes_parties_ck" CHECK ("placement_drive_change_requests"."proposer_party" in ('TPO','COMPANY') and "placement_drive_change_requests"."target_party" in ('TPO','COMPANY') and "placement_drive_change_requests"."proposer_party" <> "placement_drive_change_requests"."target_party"),
	CONSTRAINT "placement_drive_changes_mode_ck" CHECK ("placement_drive_change_requests"."mode" in ('SUGGEST','ASK')),
	CONSTRAINT "placement_drive_changes_field_ck" CHECK ("placement_drive_change_requests"."field" in ('DEADLINE','PAY','ELIGIBILITY','LOCATION','ROUNDS','OTHER')),
	CONSTRAINT "placement_drive_changes_status_ck" CHECK ("placement_drive_change_requests"."status" in ('OPEN','ACCEPTED','ANSWERED','DECLINED','WITHDRAWN')),
	CONSTRAINT "placement_drive_changes_content_ck" CHECK (length(trim("placement_drive_change_requests"."proposed_value"))>=2 and length(trim("placement_drive_change_requests"."reason"))>=3),
	CONSTRAINT "placement_drive_changes_decision_ck" CHECK (("placement_drive_change_requests"."status"='OPEN' and "placement_drive_change_requests"."decided_at" is null and "placement_drive_change_requests"."decided_by_user_id" is null) or ("placement_drive_change_requests"."status"<>'OPEN' and "placement_drive_change_requests"."decided_at" is not null and "placement_drive_change_requests"."decided_by_user_id" is not null))
);
--> statement-breakpoint
ALTER TABLE "attendance_policies" DROP CONSTRAINT "attendance_policies_correction_window_ck";--> statement-breakpoint
ALTER TABLE "placement_drive_change_request_messages" ADD CONSTRAINT "placement_drive_change_request_messages_request_id_placement_drive_change_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."placement_drive_change_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_drive_change_request_messages" ADD CONSTRAINT "placement_drive_change_request_messages_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_drive_change_requests" ADD CONSTRAINT "placement_drive_change_requests_job_id_placement_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."placement_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_drive_change_requests" ADD CONSTRAINT "placement_drive_change_requests_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_drive_change_requests" ADD CONSTRAINT "placement_drive_change_requests_decided_by_user_id_users_id_fk" FOREIGN KEY ("decided_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "placement_drive_change_messages_request_idx" ON "placement_drive_change_request_messages" USING btree ("request_id","sent_at");--> statement-breakpoint
CREATE INDEX "placement_drive_changes_job_status_idx" ON "placement_drive_change_requests" USING btree ("job_id","status","created_at");--> statement-breakpoint
ALTER TABLE "attendance_policies" ADD CONSTRAINT "attendance_policies_correction_window_ck" CHECK ("attendance_policies"."correction_window_hours" between 1 and 8760);