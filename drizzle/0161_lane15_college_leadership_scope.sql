-- College chairs are optional member roles scoped to THIS college.
-- Distinct legacy numeric people IDs must be resolved before any data backfill.
ALTER TABLE colleges
  ADD COLUMN IF NOT EXISTS chair_membership_id uuid,
  ADD COLUMN IF NOT EXISTS vice_chair_membership_id uuid;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE colleges ADD CONSTRAINT colleges_chair_membership_scope_fk
  FOREIGN KEY (chair_membership_id,id)
  REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE colleges ADD CONSTRAINT colleges_vice_chair_membership_scope_fk
  FOREIGN KEY (vice_chair_membership_id,id)
  REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
