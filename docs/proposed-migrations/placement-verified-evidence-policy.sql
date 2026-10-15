-- Proposed P-S2-01; NOT registered. Orchestrator owns numbering and replay.
-- Existing policies default to their current behaviour (verification optional).
ALTER TABLE placement_job_eligibility_policies
  ADD COLUMN IF NOT EXISTS require_verified_evidence boolean NOT NULL DEFAULT false;
-- When promoted, wire the persisted flag to the pure verification evaluator
-- BEFORE individual overrides and the application write-transaction snapshot.
