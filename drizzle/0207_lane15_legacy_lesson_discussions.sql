-- Scoped lesson discussions retain original content/thread identity.
-- App writes validate content.delivery_id = message.delivery_id before insert.
ALTER TABLE course_discussion_messages
 ADD COLUMN IF NOT EXISTS lesson_content_id uuid REFERENCES lesson_contents(id) ON DELETE RESTRICT,
 ADD COLUMN IF NOT EXISTS legacy_lesson_sequence integer,
 ADD COLUMN IF NOT EXISTS legacy_profile_name varchar(160);
CREATE INDEX IF NOT EXISTS course_discussion_messages_lesson_cursor_idx
 ON course_discussion_messages(delivery_id,lesson_content_id,created_at,id)
 WHERE lesson_content_id IS NOT NULL AND deleted_at IS NULL;
ALTER TABLE course_discussion_messages ADD CONSTRAINT course_discussion_legacy_lesson_sequence_ck
 CHECK (legacy_lesson_sequence IS NULL OR legacy_lesson_sequence >= 0);
