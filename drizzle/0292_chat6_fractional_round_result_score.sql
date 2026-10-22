-- Preserve fractional scores from legacy TPO RoundResult.score (Double).
-- The existing placement_round_results_score_ck enforces 0..100.
ALTER TABLE placement_round_results
  ALTER COLUMN score_percent TYPE numeric(18, 10)
  USING score_percent::numeric(18, 10);

-- Preserve provenance of trusted panelist results without mislabelling
-- faculty as recruiter/HR. Live input cannot select the source.
ALTER TABLE placement_round_results
  DROP CONSTRAINT placement_round_results_source_ck;
ALTER TABLE placement_round_results
  ADD CONSTRAINT placement_round_results_source_ck
  CHECK (source IN ('TPO', 'HR', 'IMPORT', 'FACULTY'));
