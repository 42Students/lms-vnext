-- PROPOSAL ONLY; orchestration must register this SQL as the next numbered migration.
-- TPO-drive-workspace-25: Applicant progression is a real stage assignment to
-- a specific test or interview round, not a renamed screening decision.
CREATE TABLE IF NOT EXISTS placement_tpo_application_stages (
  application_id uuid PRIMARY KEY,
  job_id uuid NOT NULL,
  round_id uuid NOT NULL,
  stage varchar(20) NOT NULL CHECK (stage IN ('TEST','INTERVIEW')),
  version integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  changed_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  changed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT placement_tpo_application_stage_application_fk
    FOREIGN KEY (application_id,job_id) REFERENCES placement_applications(id,job_id),
  CONSTRAINT placement_tpo_application_stage_round_fk
    FOREIGN KEY (round_id,job_id) REFERENCES placement_job_rounds(id,job_id),
  CONSTRAINT placement_tpo_application_stage_job_fk
    FOREIGN KEY (job_id) REFERENCES placement_jobs(id)
);
CREATE INDEX IF NOT EXISTS placement_tpo_application_stage_job_idx
 ON placement_tpo_application_stages(job_id,stage);
-- No implicit backfill: an absent row means no explicit transition recorded.
-- The service must fail closed while this table is absent.
