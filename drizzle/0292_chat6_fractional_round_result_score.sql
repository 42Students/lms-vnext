-- Preserve fractional scores from legacy TPO RoundResult.score (Double).
-- The existing placement_round_results_score_ck enforces 0..100.
ALTER TABLE placement_round_results
  ALTER COLUMN score_percent TYPE numeric(18, 10)
  USING score_percent::numeric(18, 10);
