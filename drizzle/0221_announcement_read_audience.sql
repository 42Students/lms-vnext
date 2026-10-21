-- [chat-14] Immutable historic targeted recipients and individual reader history.
CREATE TABLE announcement_broadcast_colleges (
 broadcast_group_id uuid NOT NULL REFERENCES announcement_broadcast_groups(id) ON DELETE RESTRICT,
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 PRIMARY KEY(broadcast_group_id,college_id)
);
--> statement-breakpoint
CREATE TABLE announcement_broadcast_learners (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 broadcast_group_id uuid NOT NULL REFERENCES announcement_broadcast_groups(id) ON DELETE RESTRICT,
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 recipient_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
 legacy_learner_id integer,
 CONSTRAINT announcement_broadcast_learners_identity_ck CHECK (recipient_user_id IS NOT NULL OR legacy_learner_id IS NOT NULL)
);
--> statement-breakpoint
CREATE UNIQUE INDEX announcement_broadcast_learners_recipient_uq ON announcement_broadcast_learners(broadcast_group_id,recipient_user_id) WHERE recipient_user_id IS NOT NULL;
--> statement-breakpoint
CREATE INDEX announcement_broadcast_learners_college_idx ON announcement_broadcast_learners(college_id,broadcast_group_id);
--> statement-breakpoint
CREATE TABLE announcement_broadcast_reader_history (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 broadcast_group_id uuid NOT NULL REFERENCES announcement_broadcast_groups(id) ON DELETE RESTRICT,
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 legacy_reader_type varchar(20),
 legacy_reader_id integer,
 reader_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
 read_at timestamptz NOT NULL,
 CONSTRAINT announcement_broadcast_reader_history_identity_ck CHECK (reader_user_id IS NOT NULL OR legacy_reader_id IS NOT NULL)
);
--> statement-breakpoint
CREATE INDEX announcement_broadcast_reader_history_scope_idx ON announcement_broadcast_reader_history(broadcast_group_id,college_id,read_at);
--> statement-breakpoint
CREATE UNIQUE INDEX announcement_broadcast_reader_history_source_uq ON announcement_broadcast_reader_history(broadcast_group_id,legacy_reader_type,legacy_reader_id) WHERE legacy_reader_id IS NOT NULL;
