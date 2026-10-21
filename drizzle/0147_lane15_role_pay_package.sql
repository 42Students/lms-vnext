-- Preserve per-role pay packages without flattening stipend into job-wide CTC.
ALTER TABLE placement_job_role_options
  ADD COLUMN ctc_lpa numeric(12,4),
  ADD COLUMN stipend_per_month_inr numeric(12,2),
  ADD COLUMN stipend_months integer;
--> statement-breakpoint
ALTER TABLE placement_job_role_options ADD CONSTRAINT placement_job_role_options_package_pay_ck
  CHECK ((ctc_lpa IS NULL OR ctc_lpa >= 0)
    AND (stipend_per_month_inr IS NULL OR stipend_per_month_inr >= 0)
    AND (stipend_months IS NULL OR stipend_months > 0));
