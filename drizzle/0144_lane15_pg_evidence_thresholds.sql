-- PG-specific percentages are nullable evidence, never inferred from UG or CGPA.
ALTER TABLE placement_candidate_academic_evidence
  ADD COLUMN IF NOT EXISTS postgraduate_pct_basis_points integer;
--> statement-breakpoint
ALTER TABLE placement_candidate_academic_evidence
  DROP CONSTRAINT placement_candidate_academic_evidence_percentages_ck;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE placement_candidate_academic_evidence ADD CONSTRAINT placement_candidate_academic_evidence_percentages_ck
  CHECK ((tenth_pct_basis_points IS NULL OR tenth_pct_basis_points BETWEEN 0 AND 10000)
    AND (twelfth_pct_basis_points IS NULL OR twelfth_pct_basis_points BETWEEN 0 AND 10000)
    AND (diploma_pct_basis_points IS NULL OR diploma_pct_basis_points BETWEEN 0 AND 10000)
    AND (undergraduate_pct_basis_points IS NULL OR undergraduate_pct_basis_points BETWEEN 0 AND 10000)
    AND (postgraduate_pct_basis_points IS NULL OR postgraduate_pct_basis_points BETWEEN 0 AND 10000))$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
ALTER TABLE placement_job_eligibility_policies
  ADD COLUMN IF NOT EXISTS min_postgraduate_pct_basis_points integer;
--> statement-breakpoint
ALTER TABLE placement_job_eligibility_policies
  DROP CONSTRAINT placement_job_eligibility_policy_percentages_ck;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE placement_job_eligibility_policies ADD CONSTRAINT placement_job_eligibility_policy_percentages_ck
  CHECK ((min_tenth_pct_basis_points IS NULL OR min_tenth_pct_basis_points BETWEEN 0 AND 10000)
    AND (min_twelfth_pct_basis_points IS NULL OR min_twelfth_pct_basis_points BETWEEN 0 AND 10000)
    AND (min_diploma_pct_basis_points IS NULL OR min_diploma_pct_basis_points BETWEEN 0 AND 10000)
    AND (min_undergraduate_pct_basis_points IS NULL OR min_undergraduate_pct_basis_points BETWEEN 0 AND 10000)
    AND (min_postgraduate_pct_basis_points IS NULL OR min_postgraduate_pct_basis_points BETWEEN 0 AND 10000))$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
