-- PROPOSED ONLY: orchestrator to register journal + snapshot after disposable PG replay.
-- This feature stays unavailable until both tables exist. Do not execute on production.
CREATE TABLE IF NOT EXISTS placement_company_applicant_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  job_id uuid NOT NULL REFERENCES placement_jobs(id) ON DELETE RESTRICT,
  created_by_membership_id uuid NOT NULL REFERENCES college_memberships(id) ON DELETE RESTRICT,
  token_hash varchar(64) NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pcas_expiry_ck CHECK (expires_at > created_at)
);
CREATE INDEX IF NOT EXISTS pcas_college_job_idx
  ON placement_company_applicant_shares(college_id,job_id);
CREATE TABLE IF NOT EXISTS placement_company_applicant_share_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id uuid NOT NULL REFERENCES placement_company_applicant_shares(id) ON DELETE RESTRICT,
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  event_kind varchar(12) NOT NULL CHECK(event_kind IN ('VIEW','CSV')),
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pcas_views_share_idx
  ON placement_company_applicant_share_views(share_id,occurred_at DESC);
-- Registration acceptance: scoped FK verification, indexes, expiry/revocation,
-- durable view events, negative foreign-college + role tests on disposable PG.
