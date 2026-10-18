-- TPO-students-10 PROPOSED ONLY: register as the next numbered migration
-- through the orchestrator, not from this lane. The original 0134 stays
-- unchanged. Existing assignment rows keep their real due dates.
-- A missing due_at means no date was set, not that the student is overdue.
ALTER TABLE placement_tpo_prep_assignments
  ALTER COLUMN due_at DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE placement_tpo_prep_assignments
  DROP CONSTRAINT IF EXISTS tpo_prep_due_after_assigned_ck;
--> statement-breakpoint
ALTER TABLE placement_tpo_prep_assignments
  ADD CONSTRAINT tpo_prep_due_after_assigned_ck
  CHECK (due_at IS NULL OR due_at > created_at);
