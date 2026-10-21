ALTER TABLE student_assignment
    ADD COLUMN submission_type VARCHAR(64) NULL AFTER html_content,
    ADD COLUMN submission_link TEXT NULL AFTER submission_type;
