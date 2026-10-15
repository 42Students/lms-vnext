CREATE TABLE "placement_hr_interview_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"round_id" uuid NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"timezone" varchar(64) NOT NULL,
	"mode" varchar(24) NOT NULL,
	"meeting_location" text,
	"panel_label" varchar(160),
	"capacity" integer NOT NULL,
	"booked_count" integer DEFAULT 0 NOT NULL,
	"status" varchar(24) DEFAULT 'PROPOSED' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hr_slot_mode_ck" CHECK ("placement_hr_interview_slots"."mode" in ('ON_CAMPUS','VIRTUAL')),
	CONSTRAINT "hr_slot_capacity_ck" CHECK ("placement_hr_interview_slots"."capacity" between 1 and 100),
	CONSTRAINT "hr_slot_status_ck" CHECK ("placement_hr_interview_slots"."status" in ('PROPOSED','OFFERED','BOOKED','CANCELLED')),
	CONSTRAINT "hr_slot_version_ck" CHECK ("placement_hr_interview_slots"."version" > 0),
	CONSTRAINT "hr_slot_count_ck" CHECK ("placement_hr_interview_slots"."booked_count" between 0 and "placement_hr_interview_slots"."capacity"),
	CONSTRAINT "hr_slot_end_ck" CHECK ("placement_hr_interview_slots"."end_at" > "placement_hr_interview_slots"."start_at"),
	CONSTRAINT "hr_slot_status_book_ck" CHECK ("placement_hr_interview_slots"."status" <> 'BOOKED' or "placement_hr_interview_slots"."booked_count" > 0)
);
--> statement-breakpoint
CREATE INDEX "hr_interview_slots_college_round_idx" ON "placement_hr_interview_slots" USING btree ("college_id","round_id","start_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "hr_interview_slots_round_start_uq" ON "placement_hr_interview_slots" USING btree ("round_id","start_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "hr_interview_round_job_parent_uq" ON "placement_job_rounds" USING btree ("id","job_id");
--> statement-breakpoint
ALTER TABLE "placement_hr_interview_slots" ADD CONSTRAINT "placement_hr_interview_slots_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_hr_interview_slots" ADD CONSTRAINT "placement_hr_interview_slots_job_id_placement_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."placement_jobs"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_hr_interview_slots" ADD CONSTRAINT "placement_hr_interview_slots_round_id_placement_job_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."placement_job_rounds"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_hr_interview_slots" ADD CONSTRAINT "placement_hr_interview_slots_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_hr_interview_slots" ADD CONSTRAINT "hr_slot_job_college_fk" FOREIGN KEY ("job_id","college_id") REFERENCES "public"."placement_jobs"("id","college_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_hr_interview_slots" ADD CONSTRAINT "hr_slot_round_job_fk" FOREIGN KEY ("round_id","job_id") REFERENCES "public"."placement_job_rounds"("id","job_id") ON DELETE no action ON UPDATE no action;
