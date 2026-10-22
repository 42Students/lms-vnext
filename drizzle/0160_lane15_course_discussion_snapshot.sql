-- Historic sender attribution and recoverable delete audit (writer cutover later).
ALTER TABLE course_discussion_messages
  ADD COLUMN IF NOT EXISTS sender_name_snapshot varchar(160),
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
--> statement-breakpoint
DO $idem$ BEGIN
  EXECUTE $stmt$ALTER TABLE course_discussion_messages
  ADD CONSTRAINT course_discussion_messages_deleted_after_create_ck
  CHECK (deleted_at IS NULL OR deleted_at >= created_at)$stmt$;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $idem$;
