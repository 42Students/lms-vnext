CREATE TABLE "placement_candidate_preferences" (
	"membership_id" uuid PRIMARY KEY NOT NULL,
	"preferred_role_titles" text[] DEFAULT '{}'::text[] NOT NULL,
	"preferred_locations" text[] DEFAULT '{}'::text[] NOT NULL,
	"preferred_employment_types" text[] DEFAULT '{}'::text[] NOT NULL,
	"preferred_work_mode" varchar(24) DEFAULT 'NO_PREFERENCE' NOT NULL,
	"shift_preference" varchar(24) DEFAULT 'NO_PREFERENCE' NOT NULL,
	"minimum_annual_ctc_inr" integer,
	"relocation_preference" varchar(24) DEFAULT 'NO_PREFERENCE' NOT NULL,
	"notify_matching_jobs" boolean DEFAULT true NOT NULL,
	"notify_application_updates" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_candidate_preferences_work_mode_ck" CHECK ("placement_candidate_preferences"."preferred_work_mode" in ('ONSITE', 'HYBRID', 'REMOTE', 'NO_PREFERENCE')),
	CONSTRAINT "placement_candidate_preferences_shift_ck" CHECK ("placement_candidate_preferences"."shift_preference" in ('DAY', 'NIGHT', 'FLEXIBLE', 'NO_PREFERENCE')),
	CONSTRAINT "placement_candidate_preferences_relocation_ck" CHECK ("placement_candidate_preferences"."relocation_preference" in ('YES', 'NO', 'NO_PREFERENCE')),
	CONSTRAINT "placement_candidate_preferences_ctc_ck" CHECK ("placement_candidate_preferences"."minimum_annual_ctc_inr" is null or "placement_candidate_preferences"."minimum_annual_ctc_inr" >= 0)
);
--> statement-breakpoint
ALTER TABLE "placement_candidate_preferences" ADD CONSTRAINT "placement_candidate_preferences_membership_id_college_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;
