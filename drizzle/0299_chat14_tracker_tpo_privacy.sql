-- [chat-14] Preserve one authenticated tracker subject and TPO privacy history.
ALTER TABLE bug_tracker_access
  ADD COLUMN IF NOT EXISTS subject_user_id uuid REFERENCES users(id) ON DELETE RESTRICT;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS db10_tracker_access_subject_user_uq
  ON bug_tracker_access (subject_user_id) WHERE subject_user_id IS NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS placement_tpo_thread_privacy_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 thread_id uuid NOT NULL,
 college_id uuid NOT NULL,
 actor_membership_id uuid NOT NULL,
 before_private boolean NOT NULL,
 after_private boolean NOT NULL,
 occurred_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT tpo_thread_privacy_parent_fk FOREIGN KEY(thread_id,college_id)
  REFERENCES placement_tpo_internal_threads(id,college_id) ON DELETE RESTRICT,
 CONSTRAINT tpo_thread_privacy_actor_fk FOREIGN KEY(actor_membership_id,college_id)
  REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT,
 CONSTRAINT tpo_thread_privacy_changed_ck CHECK (before_private <> after_private)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS tpo_thread_privacy_history_idx
  ON placement_tpo_thread_privacy_events (thread_id,occurred_at);
