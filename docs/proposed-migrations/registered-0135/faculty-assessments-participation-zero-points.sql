-- FAC-assessments-R08: participation assignments may be worth zero points.
-- Registered migrations are managed by the orchestrator; this proposal is not a numbered migration.
ALTER TABLE course_assignments
  DROP CONSTRAINT IF EXISTS course_assignments_points_ck;
ALTER TABLE course_assignments
  ADD CONSTRAINT course_assignments_points_ck
    CHECK (max_points BETWEEN 0 AND 10000);
