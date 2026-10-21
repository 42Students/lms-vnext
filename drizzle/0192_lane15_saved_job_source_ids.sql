ALTER TABLE placement_saved_jobs ADD COLUMN IF NOT EXISTS legacy_saved_job_id integer, ADD COLUMN IF NOT EXISTS legacy_learner_id integer, ADD COLUMN IF NOT EXISTS legacy_job_id integer, ADD COLUMN IF NOT EXISTS legacy_saved_at_local varchar(36);
CREATE UNIQUE INDEX IF NOT EXISTS placement_saved_jobs_legacy_id_uq ON placement_saved_jobs(legacy_saved_job_id) WHERE legacy_saved_job_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS placement_saved_jobs_job_idx ON placement_saved_jobs(job_id);
CREATE INDEX IF NOT EXISTS placement_saved_jobs_membership_time_idx ON placement_saved_jobs(membership_id,saved_at,id);
