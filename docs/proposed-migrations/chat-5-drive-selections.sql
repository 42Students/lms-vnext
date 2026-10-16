-- PROPOSAL ONLY: TPO-drive-workspace-47 / TPO-drive-workspace-48.
-- Orchestrator must register in the next numbered migration and apply on disposable PostgreSQL.
-- Do not execute automatically as a migration here.
CREATE TABLE IF NOT EXISTS placement_drive_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES placement_jobs(id) ON DELETE RESTRICT,
  application_id uuid NOT NULL REFERENCES placement_applications(id) ON DELETE RESTRICT,
  role_title text NOT NULL,
  annual_ctc_inr integer,
  status varchar(16) NOT NULL DEFAULT 'SELECTED',
  recorded_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  verified_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  verified_at timestamptz,
  released_offer_id uuid REFERENCES placement_offers(id) ON DELETE RESTRICT,
  released_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT placement_drive_selections_application_uq UNIQUE (application_id),
  CONSTRAINT placement_drive_selections_status_ck CHECK (status IN ('SELECTED','VERIFIED','RELEASED')),
  CONSTRAINT placement_drive_selections_ctc_ck CHECK (annual_ctc_inr IS NULL OR annual_ctc_inr BETWEEN 0 AND 100000000),
  CONSTRAINT placement_drive_selections_verified_ck CHECK (
    (status = 'SELECTED' AND verified_at IS NULL AND released_at IS NULL AND released_offer_id IS NULL)
    OR (status = 'VERIFIED' AND verified_at IS NOT NULL AND released_at IS NULL AND released_offer_id IS NULL)
    OR (status = 'RELEASED' AND verified_at IS NOT NULL AND released_offer_id IS NOT NULL AND released_at IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS placement_drive_selections_job_status_idx
  ON placement_drive_selections (job_id, status);
-- Register a cross-table guard/trigger or service invariants before promoting:
-- the application must belong to the same job; verified releases must point
-- to the same application as the selection. Both are checked in the service.
