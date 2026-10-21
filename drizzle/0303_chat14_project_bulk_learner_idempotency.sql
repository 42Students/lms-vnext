-- [chat-14] One project workspace per learner per class during bulk creation.
-- Null for team/non-bulk workspaces; no cross-college membership references.
-- Lane 15 owns the journal registration, after DB07 migration review.
ALTER TABLE project_instances
 ADD COLUMN IF NOT EXISTS bulk_learner_membership_id uuid;
--> statement-breakpoint
ALTER TABLE project_instances
 ADD COLUMN IF NOT EXISTS legacy_bulk_learner_id integer;
--> statement-breakpoint
ALTER TABLE project_instances
 ADD CONSTRAINT project_instances_bulk_learner_college_fk
 FOREIGN KEY (bulk_learner_membership_id,college_id)
 REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE project_instances
 ADD CONSTRAINT project_instances_bulk_learner_section_ck
 CHECK (bulk_learner_membership_id IS NULL OR section_id IS NOT NULL);
--> statement-breakpoint
CREATE UNIQUE INDEX project_instances_bulk_learner_class_uq
 ON project_instances(college_id,section_id,bulk_learner_membership_id)
 WHERE section_id IS NOT NULL AND bulk_learner_membership_id IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX project_instances_legacy_bulk_learner_class_uq
 ON project_instances(college_id,legacy_class_id,legacy_bulk_learner_id)
 WHERE legacy_class_id IS NOT NULL AND legacy_bulk_learner_id IS NOT NULL;
