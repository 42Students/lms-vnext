-- Existing 0034 messages are live by default. The service already
-- filters deleted_at and reads a snapshot; add both before activating it.
ALTER TABLE course_discussion_messages
 ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
 ADD COLUMN IF NOT EXISTS sender_name_snapshot varchar(160);
-- Current sender name is a display fallback; do not overwrite later snapshots.
UPDATE course_discussion_messages m
 SET sender_name_snapshot=left(u.display_name,160)
 FROM college_memberships cm JOIN users u ON u.id=cm.user_id
 WHERE cm.id=m.sender_membership_id AND m.sender_name_snapshot IS NULL;
ALTER TABLE course_discussion_messages
 ADD CONSTRAINT course_discussion_messages_deleted_after_create_ck
 CHECK (deleted_at IS NULL OR deleted_at >= created_at);
CREATE INDEX IF NOT EXISTS course_discussion_messages_live_cursor_idx
 ON course_discussion_messages(delivery_id,created_at,id)
 WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS course_discussion_messages_live_pin_idx
 ON course_discussion_messages(delivery_id,created_at)
 WHERE deleted_at IS NULL AND pinned=true;
