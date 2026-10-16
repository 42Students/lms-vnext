CREATE TABLE "placement_round_candidate_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"round_id" uuid NOT NULL,
	"application_id" uuid,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"room" text NOT NULL,
	"panel" text,
	"status" varchar(16) DEFAULT 'AVAILABLE' NOT NULL,
	"source" varchar(16) DEFAULT 'TPO' NOT NULL,
	"confirmed_at" timestamp with time zone,
	"changed_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "placement_round_candidate_slots_status_ck" CHECK ("placement_round_candidate_slots"."status" in ('AVAILABLE','BOOKED','CANCELLED')),
	CONSTRAINT "placement_round_candidate_slots_source_ck" CHECK ("placement_round_candidate_slots"."source" in ('TPO','RECRUITER')),
	CONSTRAINT "placement_round_candidate_slots_version_ck" CHECK ("placement_round_candidate_slots"."version" >= 1),
	CONSTRAINT "placement_round_candidate_slots_time_ck" CHECK ("placement_round_candidate_slots"."ends_at" > "placement_round_candidate_slots"."starts_at"),
	CONSTRAINT "placement_round_candidate_slots_booking_ck" CHECK (("placement_round_candidate_slots"."status" = 'BOOKED' and "placement_round_candidate_slots"."application_id" is not null) or ("placement_round_candidate_slots"."status" <> 'BOOKED' and "placement_round_candidate_slots"."application_id" is null)),
	CONSTRAINT "placement_round_candidate_slots_room_ck" CHECK (length(trim("placement_round_candidate_slots"."room")) > 0)
);
--> statement-breakpoint
ALTER TABLE "placement_round_candidate_slots" ADD CONSTRAINT "placement_round_candidate_slots_job_id_placement_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."placement_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_round_candidate_slots" ADD CONSTRAINT "placement_round_candidate_slots_round_id_placement_job_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."placement_job_rounds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_round_candidate_slots" ADD CONSTRAINT "placement_round_candidate_slots_application_id_placement_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."placement_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_round_candidate_slots" ADD CONSTRAINT "placement_round_candidate_slots_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_round_candidate_slots" ADD CONSTRAINT "candidate_slot_round_job_fk" FOREIGN KEY ("round_id","job_id") REFERENCES "public"."placement_job_rounds"("id","job_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "placement_round_candidate_slots_active_application_uq" ON "placement_round_candidate_slots" USING btree ("round_id","application_id") WHERE "placement_round_candidate_slots"."status" = 'BOOKED';--> statement-breakpoint
CREATE UNIQUE INDEX "placement_round_candidate_slots_active_room_time_uq" ON "placement_round_candidate_slots" USING btree ("round_id","room","starts_at") WHERE "placement_round_candidate_slots"."status" <> 'CANCELLED';--> statement-breakpoint
CREATE INDEX "placement_round_candidate_slots_round_date_idx" ON "placement_round_candidate_slots" USING btree ("round_id","starts_at");