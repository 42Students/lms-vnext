-- College chairs are optional member roles scoped to THIS college.
-- Distinct legacy numeric people IDs must be resolved before any data backfill.
ALTER TABLE colleges
  ADD COLUMN chair_membership_id uuid,
  ADD COLUMN vice_chair_membership_id uuid;
--> statement-breakpoint
ALTER TABLE colleges ADD CONSTRAINT colleges_chair_membership_scope_fk
  FOREIGN KEY (chair_membership_id,id)
  REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE colleges ADD CONSTRAINT colleges_vice_chair_membership_scope_fk
  FOREIGN KEY (vice_chair_membership_id,id)
  REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT;
