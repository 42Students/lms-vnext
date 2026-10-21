-- Optimistic locking for LessonContents.
--
-- Completes the set begun in V120 (course, lesson). lesson_contents is the row most exposed to
-- concurrent edits of the three: an admin editing it from the console's class-wise syllabus
-- screen and a faculty member editing the same content from the course tab are ordinary,
-- simultaneous workflows. Without a version column the later write silently discarded the
-- earlier one, with no 409 and nothing in any log.
--
-- Existing rows default to 0; new rows are written with the Hibernate-managed value.

ALTER TABLE lesson_contents
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
