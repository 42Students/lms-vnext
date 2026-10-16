-- PROPOSAL ONLY — COL-placements-01, College Admin pipeline stage and immutable history.
-- Orchestrator registers this as a numbered migration. No direct automatic changes to offers.
CREATE TABLE IF NOT EXISTS placement_college_application_stages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 job_id uuid NOT NULL REFERENCES placement_jobs(id),
 application_id uuid NOT NULL REFERENCES placement_applications(id),
 stage varchar(24) NOT NULL DEFAULT 'APPLIED',
 previous_stage varchar(24),
 version integer NOT NULL DEFAULT 1,
 moved_by_user_id uuid NOT NULL REFERENCES users(id),
 reason text NOT NULL,
 moved_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT placement_college_stages_application_uq UNIQUE(application_id),
 CONSTRAINT placement_college_stages_stage_ck CHECK(stage IN ('APPLIED','SHORTLISTED','ASSESSMENT','INTERVIEW','WAITLISTED','OFFERED','HIRED','REJECTED')),
 CONSTRAINT placement_college_stages_previous_ck CHECK(previous_stage IS NULL OR previous_stage IN ('APPLIED','SHORTLISTED','ASSESSMENT','INTERVIEW','WAITLISTED','OFFERED','HIRED','REJECTED')),
 CONSTRAINT placement_college_stages_version_ck CHECK(version>=1),
 CONSTRAINT placement_college_stages_reason_ck CHECK(length(trim(reason))>=3)
);
CREATE INDEX IF NOT EXISTS placement_college_stages_job_stage_idx ON placement_college_application_stages(job_id,stage);
CREATE TABLE IF NOT EXISTS placement_college_application_stage_history (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 stage_id uuid NOT NULL REFERENCES placement_college_application_stages(id),
 from_stage varchar(24),
 to_stage varchar(24) NOT NULL,
 reason text NOT NULL,
 actor_user_id uuid NOT NULL REFERENCES users(id),
 moved_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT placement_college_stage_history_reason_ck CHECK(length(trim(reason))>=3)
);
CREATE INDEX IF NOT EXISTS placement_college_stage_history_stage_time_idx
 ON placement_college_application_stage_history(stage_id,moved_at);
