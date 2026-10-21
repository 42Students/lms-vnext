-- Optimistic locking for Course and Lesson.
--
-- Neither entity had a @Version column, unlike StudentAssignment, ProjectWorkspace,
-- ProjectTemplate, Job, JobApplication and Interview. Two admins editing the same course
-- concurrently silently overwrote each other with no 409 and no warning — worst of all on Course,
-- where setCourseFields reads the stored metaData JSON blob, merges onto it and writes the whole
-- thing back, so a lost update discards an entire nested object rather than a single field.
--
-- Existing rows default to 0; new rows are written with the Hibernate-managed value.

ALTER TABLE course
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE lesson
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
