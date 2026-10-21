-- Qualification flag is authoritative: a PG percentage cannot be
-- treated as usable academic evidence unless the learner confirms PG.
-- Unknown qualification remains NULL, not false.
ALTER TABLE placement_candidate_academic_evidence
 ADD CONSTRAINT placement_candidate_academic_evidence_pg_qualification_ck
 CHECK (postgraduate_pct_basis_points IS NULL
        OR has_postgraduate_qualification IS TRUE);
