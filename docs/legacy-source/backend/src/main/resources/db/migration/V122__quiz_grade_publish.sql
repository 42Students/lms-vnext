-- Grade-publish concept for Quiz, matching the existing StudentAssignment.isGradePublished
-- pattern. Unlike StudentAssignment (which defaults unpublished), this defaults TRUE so no
-- existing or new quiz changes behaviour: scores stay visible immediately, exactly as today,
-- unless a faculty member explicitly withholds them for a specific quiz. That withhold action
-- did not exist at all before this migration -- scores were visible the instant submitQuiz
-- returned, with no way to correct a bad answer key or hold results pending review.
--
-- BUGFIX (found while validating an unrelated migration against a real MySQL database): this
-- targeted table `quiz`, which has never existed under that name -- the first-class quiz table
-- (see V66__first_class_quiz_tables.sql) is `quizzes` (plural), matching Quiz.java's own
-- @Table(name = "quizzes"). Every environment this migration reaches fails identically ("Table
-- 'quiz' doesn't exist") and gets permanently stuck here, since spring.flyway.validate-on-migrate
-- is false (no checksum re-validation blocks correcting an already-applied-nowhere migration).
ALTER TABLE quizzes
    ADD COLUMN is_grade_published BOOLEAN NOT NULL DEFAULT TRUE;
