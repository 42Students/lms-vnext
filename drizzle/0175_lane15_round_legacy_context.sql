-- Preserve historic subtype, mode and instructions independently of the
-- canonical round kind/mode, and never reuse numeric ID for authorization.
ALTER TABLE placement_job_rounds
 ADD COLUMN IF NOT EXISTS legacy_round_id integer,
 ADD COLUMN IF NOT EXISTS legacy_round_description text,
 ADD COLUMN IF NOT EXISTS legacy_interview_type varchar(80),
 ADD COLUMN IF NOT EXISTS legacy_mode varchar(20);
CREATE UNIQUE INDEX IF NOT EXISTS placement_job_rounds_legacy_id_uq
 ON placement_job_rounds(legacy_round_id) WHERE legacy_round_id IS NOT NULL;
ALTER TABLE placement_job_rounds ADD CONSTRAINT placement_job_rounds_legacy_description_ck
 CHECK (legacy_round_description IS NULL OR length(legacy_round_description)<=2000);
