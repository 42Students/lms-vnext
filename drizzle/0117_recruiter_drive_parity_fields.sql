ALTER TABLE "placement_jobs" ADD COLUMN "recruiter_drive_mode" varchar(16) DEFAULT 'ON_CAMPUS' NOT NULL;--> statement-breakpoint
ALTER TABLE "placement_jobs" ADD COLUMN "eligible_branches" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "placement_jobs" ADD COLUMN "eligible_passing_year" smallint;--> statement-breakpoint
ALTER TABLE "placement_jobs" ADD COLUMN "ctc_lpa" numeric(8, 2);--> statement-breakpoint
ALTER TABLE "placement_jobs" ADD COLUMN "fixed_ctc_lpa" numeric(8, 2);--> statement-breakpoint
ALTER TABLE "placement_jobs" ADD COLUMN "variable_ctc_lpa" numeric(8, 2);--> statement-breakpoint
ALTER TABLE "placement_jobs" ADD COLUMN "stipend_per_month_inr" integer;--> statement-breakpoint
ALTER TABLE "placement_jobs" ADD CONSTRAINT "placement_jobs_recruiter_drive_mode_ck" CHECK ("placement_jobs"."recruiter_drive_mode" in ('ON_CAMPUS', 'OFF_CAMPUS'));--> statement-breakpoint
ALTER TABLE "placement_jobs" ADD CONSTRAINT "placement_jobs_recruiter_eligible_passing_year_ck" CHECK ("placement_jobs"."eligible_passing_year" is null or "placement_jobs"."eligible_passing_year" between 2000 and 2199);--> statement-breakpoint
ALTER TABLE "placement_jobs" ADD CONSTRAINT "placement_jobs_recruiter_ctc_breakdown_ck" CHECK (("placement_jobs"."ctc_lpa" is null or "placement_jobs"."ctc_lpa" >= 0)
        and ("placement_jobs"."fixed_ctc_lpa" is null or "placement_jobs"."fixed_ctc_lpa" >= 0)
        and ("placement_jobs"."variable_ctc_lpa" is null or "placement_jobs"."variable_ctc_lpa" >= 0)
        and ("placement_jobs"."ctc_lpa" is null or coalesce("placement_jobs"."fixed_ctc_lpa", 0) + coalesce("placement_jobs"."variable_ctc_lpa", 0) <= "placement_jobs"."ctc_lpa")
        and ("placement_jobs"."stipend_per_month_inr" is null or "placement_jobs"."stipend_per_month_inr" >= 0));