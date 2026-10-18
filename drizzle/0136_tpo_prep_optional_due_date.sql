-- TPO-students-10: legacy Assign prep may be completed without a deadline.
-- This is additive to registered 0134; do not edit the original migration.
-- A missing due_at means no deadline was specified, not an overdue student.
ALTER TABLE placement_tpo_prep_assignments
  ALTER COLUMN due_at DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE placement_tpo_prep_assignments
  DROP CONSTRAINT IF EXISTS tpo_prep_due_after_assigned_ck;
--> statement-breakpoint
ALTER TABLE placement_tpo_prep_assignments
  ADD CONSTRAINT tpo_prep_due_after_assigned_ck
  CHECK (due_at IS NULL OR due_at > created_at);
