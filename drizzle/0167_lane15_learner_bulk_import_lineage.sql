-- Lane 15 safe DB02 learner bulk import lineage only; no mass-delete or undo primitive.
-- Greenfield schema: any historical integer ID to UUID backfill needs owner-approved crosswalk, not automatic copying.
CREATE TABLE learner_import_batches (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX learner_import_batches_id_college_uq ON learner_import_batches (id,college_id);
--> statement-breakpoint
CREATE TABLE learner_import_batch_members (
 batch_id uuid NOT NULL,
 college_id uuid NOT NULL,
 membership_id uuid NOT NULL,
 linked_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT learner_import_batch_members_pk PRIMARY KEY (batch_id,membership_id),
 CONSTRAINT learner_import_batch_members_batch_fk FOREIGN KEY (batch_id,college_id)
   REFERENCES learner_import_batches(id,college_id) ON DELETE RESTRICT,
 CONSTRAINT learner_import_batch_members_membership_fk FOREIGN KEY (membership_id,college_id)
   REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE UNIQUE INDEX learner_import_batch_member_once_uq ON learner_import_batch_members (membership_id);
-- Rollback must first prove zero attendance, assignment, project, placement, audit and auth dependencies; no SQL cascade is available.
