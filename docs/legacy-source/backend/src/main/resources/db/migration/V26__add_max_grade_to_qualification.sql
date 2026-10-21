-- ===========================================
-- V26: Add max_grade to qualification (for "max grade" + "grade obtained" per grading type)
-- ===========================================
-- Optional: when set, enables normalized comparison and job screening (e.g. 8.5/10, 85/100).

ALTER TABLE qualification ADD COLUMN max_grade VARCHAR(20) NULL DEFAULT NULL AFTER grade;
