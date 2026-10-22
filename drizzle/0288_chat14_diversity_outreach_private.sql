-- [chat-14] Privacy-restricted diversity outreach metadata, NOT screening.
-- Staged for lane-15 journal/replay after purpose, retention and consent review.
-- No employer/public applicant API may select from this relation.
CREATE TABLE IF NOT EXISTS placement_job_diversity_outreach (
  job_id uuid PRIMARY KEY REFERENCES placement_jobs(id) ON DELETE RESTRICT,
  target_gender varchar(32) NOT NULL
    CHECK (target_gender IN ('FEMALE','MALE','NON_BINARY','SELF_DESCRIBED')),
  reason text NOT NULL CHECK (length(btrim(reason)) BETWEEN 20 AND 1000),
  status varchar(16) NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT','APPROVED','DISABLED')),
  version integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  approved_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  approved_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT placement_job_diversity_approval_ck
    CHECK ((approved_by_user_id IS NULL) = (approved_at IS NULL)),
  CONSTRAINT placement_job_diversity_separation_ck
    CHECK (approved_by_user_id IS NULL OR approved_by_user_id <> created_by_user_id),
  CONSTRAINT placement_job_diversity_approved_ck
    CHECK (status <> 'APPROVED' OR approved_by_user_id IS NOT NULL)
);
--> statement-breakpoint
-- No learner gender is stored here. Never join this with employer reporting.
CREATE INDEX IF NOT EXISTS placement_job_diversity_outreach_status_idx
  ON placement_job_diversity_outreach(status);
