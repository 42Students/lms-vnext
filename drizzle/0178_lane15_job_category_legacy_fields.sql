ALTER TABLE placement_jobs ADD COLUMN IF NOT EXISTS legacy_drive_mode varchar(24),
 ADD COLUMN IF NOT EXISTS legacy_job_category varchar(24),
 ADD COLUMN IF NOT EXISTS legacy_category_override_reason varchar(500),
 ADD COLUMN IF NOT EXISTS legacy_results_auto_apply boolean,
 ADD COLUMN IF NOT EXISTS legacy_screening_version integer,
 ADD COLUMN IF NOT EXISTS legacy_candidate_preferences jsonb;
ALTER TABLE placement_jobs ADD CONSTRAINT placement_jobs_legacy_preferences_ck
 CHECK (legacy_candidate_preferences IS NULL OR jsonb_typeof(legacy_candidate_preferences)='object');
ALTER TABLE placement_jobs ADD CONSTRAINT placement_jobs_legacy_category_ck
 CHECK (legacy_category_override_reason IS NULL OR length(legacy_category_override_reason)<=500);
