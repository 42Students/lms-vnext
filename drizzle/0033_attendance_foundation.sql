CREATE TABLE "attendance_policies" (
	"college_id" uuid PRIMARY KEY NOT NULL,
	"eligibility_threshold_percent" integer DEFAULT 75 NOT NULL,
	"correction_window_hours" integer DEFAULT 24 NOT NULL,
	"updated_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_policies_threshold_ck" CHECK ("attendance_policies"."eligibility_threshold_percent" between 1 and 100),
	CONSTRAINT "attendance_policies_correction_window_ck" CHECK ("attendance_policies"."correction_window_hours" between 1 and 168)
);
--> statement-breakpoint
CREATE TABLE "attendance_sessions" (
	"schedule_event_id" uuid PRIMARY KEY NOT NULL,
	"status" varchar(24) DEFAULT 'UNMARKED' NOT NULL,
	"marked_by_user_id" uuid,
	"marked_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_sessions_status_ck" CHECK ("attendance_sessions"."status" in ('UNMARKED', 'MARKED')),
	CONSTRAINT "attendance_sessions_lifecycle_ck" CHECK (("attendance_sessions"."status" = 'UNMARKED' and "attendance_sessions"."marked_by_user_id" is null and "attendance_sessions"."marked_at" is null) or ("attendance_sessions"."status" = 'MARKED' and "attendance_sessions"."marked_by_user_id" is not null and "attendance_sessions"."marked_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schedule_event_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"status" varchar(24) NOT NULL,
	"note" varchar(1000),
	"marked_by_user_id" uuid NOT NULL,
	"marked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_records_status_ck" CHECK ("attendance_records"."status" in ('PRESENT', 'ABSENT', 'EXCUSED', 'MEDICAL', 'LATE'))
);
--> statement-breakpoint
ALTER TABLE "attendance_policies" ADD CONSTRAINT "attendance_policies_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "attendance_policies" ADD CONSTRAINT "attendance_policies_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_schedule_event_id_section_schedule_events_id_fk" FOREIGN KEY ("schedule_event_id") REFERENCES "public"."section_schedule_events"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_marked_by_user_id_users_id_fk" FOREIGN KEY ("marked_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_schedule_event_id_section_schedule_events_id_fk" FOREIGN KEY ("schedule_event_id") REFERENCES "public"."section_schedule_events"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_membership_id_college_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_marked_by_user_id_users_id_fk" FOREIGN KEY ("marked_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "attendance_sessions_status_idx" ON "attendance_sessions" USING btree ("status","updated_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_records_event_membership_uq" ON "attendance_records" USING btree ("schedule_event_id","membership_id");
--> statement-breakpoint
CREATE INDEX "attendance_records_membership_event_idx" ON "attendance_records" USING btree ("membership_id","schedule_event_id");
--> statement-breakpoint
CREATE INDEX "attendance_records_event_status_idx" ON "attendance_records" USING btree ("schedule_event_id","status");
