-- Proposed only: P-S2-02. The orchestrator owns registered migrations.
-- Basis points: 75.25% = 7525. No runtime reads until promotion.
ALTER TABLE placement_job_eligibility_policies
  ADD COLUMN IF NOT EXISTS min_pct_throughout_basis_points integer;
ALTER TABLE placement_job_eligibility_policies
  ADD CONSTRAINT placement_job_policy_pct_throughout_ck
  CHECK (min_pct_throughout_basis_points IS NULL OR
    min_pct_throughout_basis_points BETWEEN 0 AND 10000);
