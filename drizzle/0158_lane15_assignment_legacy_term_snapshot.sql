-- Legacy assignment grades and semester snapshots remain evidence; vNext grade
-- state NOT_GRADED/GRADED stays the active authoritative workflow.
ALTER TABLE course_assignments
  ALTER COLUMN allowed_submission_methods
  SET DEFAULT '["WRITTEN_RESPONSE"]'::jsonb;
--> statement-breakpoint
ALTER TABLE assignment_submissions
  ADD COLUMN semester_number integer,
  ADD COLUMN legacy_submission_snapshot jsonb,
  ADD COLUMN legacy_grading_kind text;
--> statement-breakpoint
ALTER TABLE assignment_submissions
  ADD CONSTRAINT assignment_submissions_semester_ck CHECK (semester_number IS NULL OR semester_number > 0),
  ADD CONSTRAINT assignment_submissions_legacy_grade_kind_ck
    CHECK (legacy_grading_kind IS NULL OR legacy_grading_kind IN
      ('NOT_GRADED','AUTO_GRADED','MANUALLY_GRADED','PARTIALLY_GRADED')),
  ADD CONSTRAINT assignment_submissions_legacy_snapshot_ck
    CHECK (legacy_submission_snapshot IS NULL OR jsonb_typeof(legacy_submission_snapshot) = 'object');
