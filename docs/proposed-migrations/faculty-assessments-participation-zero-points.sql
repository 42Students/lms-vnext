-- FAC-assessments-R08: participation assignments may have zero points.
-- Register as numbered migration only after disposable DB verification.
ALTER TABLE course_assignments DROP CONSTRAINT IF EXISTS course_assignments_points_ck;
ALTER TABLE course_assignments ADD CONSTRAINT course_assignments_points_ck CHECK (max_points BETWEEN 0 AND 10000);
