-- Preserve per-role pay packages without flattening stipend into job-wide CTC.
ALTER TABLE placement_job_role_options
  ADD COLUMN IF NOT EXISTS ctc_lpa numeric(12,4),
  ADD COLUMN IF NOT EXISTS stipend_per_month_inr numeric(12,2),
  ADD COLUMN IF NOT EXISTS stipend_months integer;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE placement_job_role_options ADD CONSTRAINT placement_job_role_options_package_pay_ck
  CHECK ((ctc_lpa IS NULL OR ctc_lpa >= 0)
    AND (stipend_per_month_inr IS NULL OR stipend_per_month_inr >= 0)
    AND (stipend_months IS NULL OR stipend_months > 0))$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
