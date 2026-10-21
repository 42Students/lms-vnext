-- Original package array order is retained for explicit legacy imports.
ALTER TABLE placement_job_role_options ADD COLUMN IF NOT EXISTS position smallint;
CREATE UNIQUE INDEX IF NOT EXISTS placement_role_options_job_position_uq
 ON placement_job_role_options(job_id,position)
 WHERE position IS NOT NULL AND status='ACTIVE';
ALTER TABLE placement_job_role_options ADD CONSTRAINT placement_role_options_position_ck
 CHECK (position IS NULL OR position BETWEEN 0 AND 100);
