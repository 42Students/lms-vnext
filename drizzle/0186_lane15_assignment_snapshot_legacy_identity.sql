ALTER TABLE course_assignments ADD COLUMN IF NOT EXISTS legacy_lesson_content_id integer;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS course_assignments_legacy_content_uq
 ON course_assignments(legacy_lesson_content_id) WHERE legacy_lesson_content_id IS NOT NULL;
--> statement-breakpoint
ALTER TABLE assignment_submissions
 ADD COLUMN IF NOT EXISTS legacy_student_assignment_id bigint,
 ADD COLUMN IF NOT EXISTS legacy_learner_id integer,
 ADD COLUMN IF NOT EXISTS max_points_at_submission integer,
 ADD COLUMN IF NOT EXISTS legacy_points_awarded bigint,
 ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
--> statement-breakpoint
UPDATE assignment_submissions s SET max_points_at_submission=a.max_points
 FROM course_assignments a WHERE s.assignment_id=a.id AND s.max_points_at_submission IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS assignment_submissions_legacy_source_uq
 ON assignment_submissions(legacy_student_assignment_id)
 WHERE legacy_student_assignment_id IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS assignment_submissions_live_lookup_idx
 ON assignment_submissions(assignment_id,deleted_at,submitted_at);
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE assignment_submissions ADD CONSTRAINT assignment_submissions_max_snapshot_ck
 CHECK (max_points_at_submission IS NULL OR max_points_at_submission BETWEEN 0 AND 10000)$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
