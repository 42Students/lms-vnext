CREATE TABLE "placement_drive_day_coordinator_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"learner_membership_id" uuid NOT NULL,
	"on_date" date NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "placement_round_attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"status" varchar(24) NOT NULL,
	"room" text,
	"marked_by_user_id" uuid NOT NULL,
	"marked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_round_attendance_status_ck" CHECK ("placement_round_attendance"."status" in ('PRESENT', 'IN_INTERVIEW', 'DONE', 'ABSENT'))
);
--> statement-breakpoint
ALTER TABLE "placement_drive_day_coordinator_assignments" ADD CONSTRAINT "placement_drive_day_coordinator_assignments_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_drive_day_coordinator_assignments" ADD CONSTRAINT "placement_drive_day_coordinator_assignments_job_id_placement_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."placement_jobs"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_drive_day_coordinator_assignments" ADD CONSTRAINT "placement_drive_day_coordinator_assignments_learner_membership_id_college_memberships_id_fk" FOREIGN KEY ("learner_membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_drive_day_coordinator_assignments" ADD CONSTRAINT "placement_drive_day_coordinator_assignments_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_round_attendance" ADD CONSTRAINT "placement_round_attendance_round_id_placement_job_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."placement_job_rounds"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_round_attendance" ADD CONSTRAINT "placement_round_attendance_application_id_placement_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."placement_applications"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_round_attendance" ADD CONSTRAINT "placement_round_attendance_marked_by_user_id_users_id_fk" FOREIGN KEY ("marked_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "placement_drive_day_coordinator_assignment_uq" ON "placement_drive_day_coordinator_assignments" USING btree ("job_id","learner_membership_id","on_date");
--> statement-breakpoint
CREATE INDEX "placement_drive_day_coordinator_membership_date_idx" ON "placement_drive_day_coordinator_assignments" USING btree ("learner_membership_id","on_date");
--> statement-breakpoint
CREATE INDEX "placement_drive_day_coordinator_college_date_idx" ON "placement_drive_day_coordinator_assignments" USING btree ("college_id","on_date");
--> statement-breakpoint
CREATE UNIQUE INDEX "placement_round_attendance_round_application_uq" ON "placement_round_attendance" USING btree ("round_id","application_id");
--> statement-breakpoint
CREATE INDEX "placement_round_attendance_round_status_idx" ON "placement_round_attendance" USING btree ("round_id","status");
