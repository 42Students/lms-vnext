ALTER TABLE lesson_contents
    ADD COLUMN deleted_with_lesson BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_lesson_contents_deleted_with_lesson
    ON lesson_contents (lesson_id, deleted_with_lesson, is_deleted);
