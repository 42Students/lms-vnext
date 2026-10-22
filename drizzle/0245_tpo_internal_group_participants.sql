-- [chat-14] Proposed group roster. Existing direct-only author trigger requires service integration.
ALTER TABLE placement_tpo_internal_threads ADD COLUMN IF NOT EXISTS kind varchar(16) NOT NULL DEFAULT 'DIRECT';
--> statement-breakpoint
ALTER TABLE placement_tpo_internal_threads ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT true;
--> statement-breakpoint
ALTER TABLE placement_tpo_internal_threads ADD COLUMN IF NOT EXISTS context_id uuid;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE placement_tpo_internal_threads ADD CONSTRAINT tpo_internal_threads_kind_ck
  CHECK(kind IN ('DIRECT','TOPIC','DRIVE','COMPANY'))$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE placement_tpo_internal_threads ADD CONSTRAINT tpo_internal_threads_context_ck
  CHECK((kind IN ('DIRECT','TOPIC') AND context_id IS NULL)
    OR (kind IN ('DRIVE','COMPANY') AND context_id IS NOT NULL))$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS tpo_internal_threads_college_kind_idx
  ON placement_tpo_internal_threads(college_id,kind,created_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS placement_tpo_internal_thread_participants (
  thread_id uuid NOT NULL,
  college_id uuid NOT NULL,
  membership_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  CONSTRAINT tpo_internal_thread_participants_pk PRIMARY KEY(thread_id,membership_id),
  CONSTRAINT tpo_internal_thread_participants_thread_college_fk
    FOREIGN KEY(thread_id,college_id) REFERENCES placement_tpo_internal_threads(id,college_id) ON DELETE RESTRICT,
  CONSTRAINT tpo_internal_thread_participants_member_college_fk
    FOREIGN KEY(membership_id,college_id) REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT,
  CONSTRAINT tpo_internal_thread_participants_leave_ck CHECK(left_at IS NULL OR left_at >= joined_at)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS tpo_internal_thread_participants_member_idx
  ON placement_tpo_internal_thread_participants(college_id,membership_id,left_at);
--> statement-breakpoint
INSERT INTO placement_tpo_internal_thread_participants(thread_id,college_id,membership_id)
SELECT id,college_id,started_by_membership_id FROM placement_tpo_internal_threads
UNION
SELECT id,college_id,invited_membership_id FROM placement_tpo_internal_threads
ON CONFLICT(thread_id,membership_id) DO NOTHING;
