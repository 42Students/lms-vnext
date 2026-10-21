-- Source eligibility override ID, job/learner IDs and actor require
-- verified same-college UUID crosswalks. Preserve reason, original created
-- time and revoked time as distinct chronology, after timezone conversion.
-- Multiple old records for one job/learner retain history; only the most
-- recent nonrevoked record may remain active. No automatic old data import.
CREATE TABLE "placement_candidate_academic_evidence" (
	"membership_id" uuid PRIMARY KEY NOT NULL,
	"cgpa_hundredths" integer,
	"active_backlogs" integer,
	"past_backlogs" integer,
	"tenth_pct_basis_points" integer,
	"twelfth_pct_basis_points" integer,
	"diploma_pct_basis_points" integer,
	"undergraduate_pct_basis_points" integer,
	"gap_years" integer,
	"is_lateral_entry" boolean DEFAULT false NOT NULL,
	"passing_year" integer,
	"source" varchar(16) DEFAULT 'SELF' NOT NULL,
	"verified_by_user_id" uuid,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_candidate_academic_evidence_cgpa_ck" CHECK ("placement_candidate_academic_evidence"."cgpa_hundredths" is null or "placement_candidate_academic_evidence"."cgpa_hundredths" between 0 and 1000),
	CONSTRAINT "placement_candidate_academic_evidence_backlogs_ck" CHECK (("placement_candidate_academic_evidence"."active_backlogs" is null or "placement_candidate_academic_evidence"."active_backlogs" >= 0)
        and ("placement_candidate_academic_evidence"."past_backlogs" is null or "placement_candidate_academic_evidence"."past_backlogs" >= 0)),
	CONSTRAINT "placement_candidate_academic_evidence_percentages_ck" CHECK (("placement_candidate_academic_evidence"."tenth_pct_basis_points" is null or "placement_candidate_academic_evidence"."tenth_pct_basis_points" between 0 and 10000)
        and ("placement_candidate_academic_evidence"."twelfth_pct_basis_points" is null or "placement_candidate_academic_evidence"."twelfth_pct_basis_points" between 0 and 10000)
        and ("placement_candidate_academic_evidence"."diploma_pct_basis_points" is null or "placement_candidate_academic_evidence"."diploma_pct_basis_points" between 0 and 10000)
        and ("placement_candidate_academic_evidence"."undergraduate_pct_basis_points" is null or "placement_candidate_academic_evidence"."undergraduate_pct_basis_points" between 0 and 10000)),
	CONSTRAINT "placement_candidate_academic_evidence_gap_ck" CHECK ("placement_candidate_academic_evidence"."gap_years" is null or "placement_candidate_academic_evidence"."gap_years" >= 0),
	CONSTRAINT "placement_candidate_academic_evidence_passing_year_ck" CHECK ("placement_candidate_academic_evidence"."passing_year" is null or "placement_candidate_academic_evidence"."passing_year" between 1950 and 2200),
	CONSTRAINT "placement_candidate_academic_evidence_source_ck" CHECK ("placement_candidate_academic_evidence"."source" in ('SELF', 'VERIFIED')),
	CONSTRAINT "placement_candidate_academic_evidence_verification_ck" CHECK (("placement_candidate_academic_evidence"."source" = 'VERIFIED' and "placement_candidate_academic_evidence"."verified_by_user_id" is not null and "placement_candidate_academic_evidence"."verified_at" is not null)
        or ("placement_candidate_academic_evidence"."source" = 'SELF' and "placement_candidate_academic_evidence"."verified_by_user_id" is null and "placement_candidate_academic_evidence"."verified_at" is null))
);
--> statement-breakpoint
CREATE TABLE "placement_job_eligibility_policies" (
	"job_id" uuid PRIMARY KEY NOT NULL,
	"allowed_program_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"allowed_cohort_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"min_cgpa_hundredths" integer,
	"max_active_backlogs" integer,
	"max_past_backlogs" integer,
	"min_tenth_pct_basis_points" integer,
	"min_twelfth_pct_basis_points" integer,
	"min_diploma_pct_basis_points" integer,
	"min_undergraduate_pct_basis_points" integer,
	"max_gap_years" integer,
	"allowed_passing_years" integer[] DEFAULT '{}'::integer[] NOT NULL,
	"missing_evidence_policy" varchar(32) DEFAULT 'ALLOW_WITH_FLAG' NOT NULL,
	"updated_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_job_eligibility_policy_cgpa_ck" CHECK ("placement_job_eligibility_policies"."min_cgpa_hundredths" is null or "placement_job_eligibility_policies"."min_cgpa_hundredths" between 0 and 1000),
	CONSTRAINT "placement_job_eligibility_policy_backlogs_ck" CHECK (("placement_job_eligibility_policies"."max_active_backlogs" is null or "placement_job_eligibility_policies"."max_active_backlogs" >= 0)
        and ("placement_job_eligibility_policies"."max_past_backlogs" is null or "placement_job_eligibility_policies"."max_past_backlogs" >= 0)),
	CONSTRAINT "placement_job_eligibility_policy_percentages_ck" CHECK (("placement_job_eligibility_policies"."min_tenth_pct_basis_points" is null or "placement_job_eligibility_policies"."min_tenth_pct_basis_points" between 0 and 10000)
        and ("placement_job_eligibility_policies"."min_twelfth_pct_basis_points" is null or "placement_job_eligibility_policies"."min_twelfth_pct_basis_points" between 0 and 10000)
        and ("placement_job_eligibility_policies"."min_diploma_pct_basis_points" is null or "placement_job_eligibility_policies"."min_diploma_pct_basis_points" between 0 and 10000)
        and ("placement_job_eligibility_policies"."min_undergraduate_pct_basis_points" is null or "placement_job_eligibility_policies"."min_undergraduate_pct_basis_points" between 0 and 10000)),
	CONSTRAINT "placement_job_eligibility_policy_gap_ck" CHECK ("placement_job_eligibility_policies"."max_gap_years" is null or "placement_job_eligibility_policies"."max_gap_years" >= 0),
	CONSTRAINT "placement_job_eligibility_policy_missing_ck" CHECK ("placement_job_eligibility_policies"."missing_evidence_policy" in ('ALLOW_WITH_FLAG', 'REQUIRE_COMPLETE'))
);
--> statement-breakpoint
CREATE TABLE "placement_eligibility_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"decision" varchar(16) NOT NULL,
	"reason" text NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_eligibility_overrides_decision_ck" CHECK ("placement_eligibility_overrides"."decision" in ('INCLUDE', 'EXCLUDE')),
	CONSTRAINT "placement_eligibility_overrides_reason_ck" CHECK (length(trim("placement_eligibility_overrides"."reason")) > 0)
);
--> statement-breakpoint
ALTER TABLE "placement_candidate_academic_evidence" ADD CONSTRAINT "placement_candidate_academic_evidence_membership_id_college_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_candidate_academic_evidence" ADD CONSTRAINT "placement_candidate_academic_evidence_verified_by_user_id_users_id_fk" FOREIGN KEY ("verified_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_job_eligibility_policies" ADD CONSTRAINT "placement_job_eligibility_policies_job_id_placement_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."placement_jobs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_job_eligibility_policies" ADD CONSTRAINT "placement_job_eligibility_policies_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_eligibility_overrides" ADD CONSTRAINT "placement_eligibility_overrides_job_id_placement_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."placement_jobs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_eligibility_overrides" ADD CONSTRAINT "placement_eligibility_overrides_membership_id_college_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_eligibility_overrides" ADD CONSTRAINT "placement_eligibility_overrides_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "placement_eligibility_overrides_active_uq" ON "placement_eligibility_overrides" USING btree ("job_id","membership_id") WHERE "placement_eligibility_overrides"."revoked_at" is null;--> statement-breakpoint
CREATE INDEX "placement_eligibility_overrides_member_idx" ON "placement_eligibility_overrides" USING btree ("membership_id","revoked_at");
