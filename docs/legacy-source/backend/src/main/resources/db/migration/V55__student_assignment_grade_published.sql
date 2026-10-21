-- AQ-05: Add grade publish flag to student_assignment.
-- Grades are now only visible to learners after faculty explicitly publishes them.
ALTER TABLE student_assignment
    ADD COLUMN is_grade_published TINYINT(1) NOT NULL DEFAULT 0;
