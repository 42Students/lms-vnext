-- REC-home-drives-24, REC-home-drives-25, REC-home-drives-26
-- PROPOSAL, not registered. Orchestrator must serialize and register.
-- Request drafts in placement_recruiter_drive_requests.draft (0101) already
-- retain these fields. Approval must validate and copy the accepted values to
-- the published placement job in the same tenant-checked transaction.
ALTER TABLE placement_jobs
  ADD COLUMN IF NOT EXISTS recruiter_drive_mode varchar(16)
    NOT NULL DEFAULT 'ON_CAMPUS',
  ADD COLUMN IF NOT EXISTS eligible_branches text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS eligible_passing_year smallint,
  ADD COLUMN IF NOT EXISTS ctc_lpa numeric(8,2),
  ADD COLUMN IF NOT EXISTS fixed_ctc_lpa numeric(8,2),
  ADD COLUMN IF NOT EXISTS variable_ctc_lpa numeric(8,2),
  ADD COLUMN IF NOT EXISTS stipend_per_month_inr integer;

ALTER TABLE placement_jobs
  ADD CONSTRAINT placement_jobs_recruiter_drive_mode_ck
  CHECK (recruiter_drive_mode IN ('ON_CAMPUS','OFF_CAMPUS')),
  ADD CONSTRAINT placement_jobs_recruiter_eligible_passing_year_ck
  CHECK (eligible_passing_year IS NULL OR eligible_passing_year BETWEEN 2000 AND 2199),
  ADD CONSTRAINT placement_jobs_recruiter_ctc_breakdown_ck
  CHECK (
    (ctc_lpa IS NULL OR ctc_lpa >= 0)
    AND (fixed_ctc_lpa IS NULL OR fixed_ctc_lpa >= 0)
    AND (variable_ctc_lpa IS NULL OR variable_ctc_lpa >= 0)
    AND (ctc_lpa IS NULL OR coalesce(fixed_ctc_lpa,0)+coalesce(variable_ctc_lpa,0)<=ctc_lpa)
    AND (stipend_per_month_inr IS NULL OR stipend_per_month_inr>=0)
  );

-- The existing placement_jobs_employment_type_ck currently permits only
-- FULL_TIME, INTERNSHIP, CONTRACT. The TPO must decide whether to register
-- INTERNSHIP_FULL_TIME as a new canonical enum-like value or map to the existing
-- placement_job_role_options representation before changing that constraint.
-- Do NOT weaken that constraint or publish unsupported drafts in isolation.
-- Register the corresponding Drizzle schema, college-safe approval write,
-- student-visible preview and college permission checks with this migration.
