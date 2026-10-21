-- Historic sender attribution and recoverable delete audit (writer cutover later).
ALTER TABLE course_discussion_messages
  ADD COLUMN sender_name_snapshot varchar(160),
  ADD COLUMN deleted_at timestamptz;
--> statement-breakpoint
ALTER TABLE course_discussion_messages
  ADD CONSTRAINT course_discussion_messages_deleted_after_create_ck
  CHECK (deleted_at IS NULL OR deleted_at >= created_at);
