-- Proposal only. Orchestrator registers the numbered migration (SA-placements-projects-24).
ALTER TABLE placement_companies ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE placement_companies ADD COLUMN IF NOT EXISTS verified_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS placement_companies_verified_idx ON placement_companies (verified_at);
ALTER TABLE placement_companies ADD CONSTRAINT placement_companies_verifier_ck
 CHECK ((verified_at IS NULL) = (verified_by_user_id IS NULL));
