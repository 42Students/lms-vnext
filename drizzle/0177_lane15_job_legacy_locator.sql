-- Historic numeric ID, reserved slug, and original visibility flags are
-- provenance only. Legacy deletion maps to ARCHIVED before imported rows
-- become visible; the college relationship remains authoritative.
ALTER TABLE placement_jobs
 ADD COLUMN IF NOT EXISTS legacy_job_id integer,
 ADD COLUMN IF NOT EXISTS legacy_slug varchar(160),
 ADD COLUMN IF NOT EXISTS legacy_season_id integer,
 ADD COLUMN IF NOT EXISTS legacy_posted_at timestamptz,
 ADD COLUMN IF NOT EXISTS legacy_creator_role varchar(24),
 ADD COLUMN IF NOT EXISTS legacy_was_deleted boolean,
 ADD COLUMN IF NOT EXISTS legacy_is_draft boolean,
 ADD COLUMN IF NOT EXISTS legacy_is_active boolean,
 ADD COLUMN IF NOT EXISTS legacy_visibility_type varchar(24),
 ADD COLUMN IF NOT EXISTS legacy_targeting jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS placement_jobs_legacy_id_uq
 ON placement_jobs(legacy_job_id) WHERE legacy_job_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS placement_jobs_legacy_slug_uq
 ON placement_jobs(lower(legacy_slug)) WHERE legacy_slug IS NOT NULL;
ALTER TABLE placement_jobs ADD CONSTRAINT placement_jobs_legacy_targeting_ck
 CHECK (legacy_targeting IS NULL OR jsonb_typeof(legacy_targeting)='object');
ALTER TABLE placement_jobs ADD CONSTRAINT placement_jobs_legacy_deleted_ck
 CHECK (legacy_was_deleted IS DISTINCT FROM TRUE OR status='ARCHIVED');
