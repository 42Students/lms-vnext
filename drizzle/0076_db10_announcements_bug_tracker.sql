CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"college_id" uuid NOT NULL,
	"receiver_type" varchar(24) NOT NULL,
	"receiver_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"sender_user_id" uuid NOT NULL,
	"sender_type" varchar(32) NOT NULL,
	"scheduled_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_by_user_id" uuid,
	"version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "db10_announcements_receiver_type_ck" CHECK ("announcements"."receiver_type" in ('COLLEGE','PROGRAM','DEPARTMENT','LEARNER','FACULTY','CLASS')),
	CONSTRAINT "db10_announcements_sender_type_ck" CHECK ("announcements"."sender_type" in ('SUPER_ADMIN','COLLEGE_ADMIN','FACULTY','LEARNER','TPO','SYSTEM')),
	CONSTRAINT "db10_announcements_version_ck" CHECK ("announcements"."version" >= 0),
	CONSTRAINT "db10_announcements_schedule_order_ck" CHECK ("announcements"."expires_at" is null or "announcements"."scheduled_at" is null or "announcements"."expires_at" > "announcements"."scheduled_at"),
	CONSTRAINT "db10_announcements_delete_shape_ck" CHECK (("announcements"."deleted_at" is null and "announcements"."deleted_by_user_id" is null)
        or ("announcements"."deleted_at" is not null and "announcements"."deleted_by_user_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "bug_report_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bug_report_id" uuid NOT NULL,
	"activity_type" varchar(40) NOT NULL,
	"actor_user_id" uuid,
	"actor_access_id" uuid,
	"actor_name" varchar(120),
	"from_value" varchar(255),
	"to_value" varchar(255),
	"note" varchar(1000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "db10_bug_report_activity_type_ck" CHECK ("activity_type" in ('STATUS_CHANGED','RESOLUTION_CHANGED','WORKFLOW_UPDATED','RETEST','CREATED')),
	CONSTRAINT "db10_bug_report_activity_actor_ck" CHECK (("actor_user_id" is not null) <> ("actor_access_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "bug_report_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bug_report_id" uuid NOT NULL,
	"storage_key" varchar(700) NOT NULL,
	"original_filename" varchar(255) NOT NULL,
	"content_type" varchar(100) NOT NULL,
	"size_bytes" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "db10_bug_report_attachments_mime_ck" CHECK ("content_type" in ('image/png','image/jpeg','image/webp')),
	CONSTRAINT "db10_bug_report_attachments_size_ck" CHECK ("size_bytes" between 1 and 8388608)
);
--> statement-breakpoint
CREATE TABLE "bug_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" varchar(24) NOT NULL,
	"reporter_access_id" uuid NOT NULL,
	"college_id" uuid,
	"reporter_name" varchar(120) NOT NULL,
	"account_role" varchar(32) NOT NULL,
	"environment" varchar(32) NOT NULL,
	"page" varchar(120) NOT NULL,
	"screen" varchar(120),
	"section" varchar(120),
	"issue_type" varchar(80) NOT NULL,
	"description" text NOT NULL,
	"severity" varchar(32) NOT NULL,
	"evidence_link" varchar(1000),
	"source_url" varchar(2000),
	"source_path" varchar(500),
	"browser" varchar(500),
	"viewport" varchar(64),
	"status" varchar(32) DEFAULT 'NEW' NOT NULL,
	"resolution" varchar(32),
	"affected_layer" varchar(24),
	"root_cause" text,
	"fix_notes" text,
	"frontend_commit_sha" varchar(64),
	"backend_commit_sha" varchar(64),
	"regression_test_status" varchar(24) DEFAULT 'NOT_REVIEWED' NOT NULL,
	"production_verified" boolean DEFAULT false NOT NULL,
	"retest_status" varchar(24) DEFAULT 'NOT_RETESTED' NOT NULL,
	"retested_at" timestamp with time zone,
	"version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "db10_bug_reports_status_ck" CHECK ("status" in ('NEW','CHECKING','FIXING','READY_FOR_RETEST','CLOSED')),
	CONSTRAINT "db10_bug_reports_resolution_ck" CHECK ("resolution" is null or "resolution" in ('FIXED','DUPLICATE','NOT_A_BUG','CANNOT_REPRODUCE','WONT_FIX')),
	CONSTRAINT "db10_bug_reports_regression_ck" CHECK ("regression_test_status" in ('NOT_REVIEWED','NOT_REQUIRED','PLANNED','ADDED')),
	CONSTRAINT "db10_bug_reports_retest_ck" CHECK ("retest_status" in ('NOT_RETESTED','PASS','FAIL')),
	CONSTRAINT "db10_bug_reports_retest_timestamp_ck" CHECK (("retest_status" = 'NOT_RETESTED' and "retested_at" is null) or ("retest_status" <> 'NOT_RETESTED' and "retested_at" is not null)),
	CONSTRAINT "db10_bug_reports_version_ck" CHECK ("version" >= 0),
	CONSTRAINT "db10_bug_reports_severity_ck" CHECK ("severity" in ('BLOCKER','CRITICAL','MAJOR','MINOR','UI_ONLY','SUGGESTION','NOT_SURE')),
	CONSTRAINT "db10_bug_reports_environment_ck" CHECK ("environment" in ('LOCAL','DEVELOPMENT','UAT','PRODUCTION','OTHER','NOT_SURE')),
	CONSTRAINT "db10_bug_reports_account_role_ck" CHECK ("account_role" in ('LEARNER','FACULTY','MENTOR','COLLEGE_ADMIN','SUPER_ADMIN','NOT_SURE')),
	CONSTRAINT "db10_bug_reports_layer_ck" CHECK ("affected_layer" is null or "affected_layer" in ('FRONTEND','BACKEND','BOTH','UNKNOWN'))
);
--> statement-breakpoint
CREATE TABLE "bug_tracker_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"access_role" varchar(24) DEFAULT 'REPORTER' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "db10_tracker_access_role_ck" CHECK ("access_role" in ('REPORTER','MANAGER')),
	CONSTRAINT "db10_tracker_access_hash_ck" CHECK ("token_hash" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "bug_tracker_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"access_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "db10_tracker_sessions_hash_ck" CHECK ("token_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "db10_tracker_sessions_revoke_ck" CHECK ("revoked_at" is null or "revoked_at" >= "created_at")
);
--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_deleted_by_user_id_users_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bug_report_activities" ADD CONSTRAINT "bug_report_activities_bug_report_id_bug_reports_id_fk" FOREIGN KEY ("bug_report_id") REFERENCES "public"."bug_reports"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bug_report_activities" ADD CONSTRAINT "bug_report_activities_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bug_report_activities" ADD CONSTRAINT "bug_report_activities_actor_access_id_bug_tracker_access_id_fk" FOREIGN KEY ("actor_access_id") REFERENCES "public"."bug_tracker_access"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bug_report_attachments" ADD CONSTRAINT "bug_report_attachments_bug_report_id_bug_reports_id_fk" FOREIGN KEY ("bug_report_id") REFERENCES "public"."bug_reports"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bug_reports" ADD CONSTRAINT "bug_reports_reporter_access_id_bug_tracker_access_id_fk" FOREIGN KEY ("reporter_access_id") REFERENCES "public"."bug_tracker_access"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bug_reports" ADD CONSTRAINT "bug_reports_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bug_tracker_sessions" ADD CONSTRAINT "bug_tracker_sessions_access_id_bug_tracker_access_id_fk" FOREIGN KEY ("access_id") REFERENCES "public"."bug_tracker_access"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "db10_announcements_scope_deleted_time_idx" ON "announcements" USING btree ("college_id","deleted_at","created_at");--> statement-breakpoint
CREATE INDEX "db10_announcements_org_deleted_time_idx" ON "announcements" USING btree ("organization_id","deleted_at","created_at");--> statement-breakpoint
CREATE INDEX "db10_announcements_recipient_visibility_idx" ON "announcements" USING btree ("receiver_type","receiver_id","deleted_at","scheduled_at","expires_at","is_pinned");--> statement-breakpoint
CREATE INDEX "db10_bug_report_activity_report_time_idx" ON "bug_report_activities" USING btree ("bug_report_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "db10_bug_report_attachments_key_uq" ON "bug_report_attachments" USING btree ("storage_key");--> statement-breakpoint
CREATE INDEX "db10_bug_report_attachments_report_time_idx" ON "bug_report_attachments" USING btree ("bug_report_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "db10_bug_reports_public_id_uq" ON "bug_reports" USING btree (lower("public_id"));--> statement-breakpoint
CREATE INDEX "db10_bug_reports_status_time_idx" ON "bug_reports" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "db10_bug_reports_reporter_time_idx" ON "bug_reports" USING btree ("reporter_access_id","created_at");--> statement-breakpoint
CREATE INDEX "db10_bug_reports_college_time_idx" ON "bug_reports" USING btree ("college_id","created_at");--> statement-breakpoint
CREATE INDEX "db10_bug_reports_environment_time_idx" ON "bug_reports" USING btree ("environment","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "db10_tracker_access_hash_uq" ON "bug_tracker_access" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "db10_tracker_access_role_active_idx" ON "bug_tracker_access" USING btree ("active","access_role");--> statement-breakpoint
CREATE UNIQUE INDEX "db10_tracker_sessions_hash_uq" ON "bug_tracker_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "db10_tracker_sessions_access_expiry_idx" ON "bug_tracker_sessions" USING btree ("access_id","expires_at");--> statement-breakpoint
CREATE INDEX "db10_tracker_sessions_expiry_idx" ON "bug_tracker_sessions" USING btree ("expires_at");