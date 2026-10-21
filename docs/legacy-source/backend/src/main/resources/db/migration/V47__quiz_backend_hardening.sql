-- V47: Quiz/Exam backend hardening
-- Adds columns for: optimistic locking, grading status, grade audit trail,
-- deadline enforcement, re-attempt support, quiz draft save
--
-- NOTE: ddl-auto=update may have already created some columns via Hibernate.
-- All ADD COLUMN uses a helper procedure for idempotency.
-- Flyway does not support DELIMITER, so we use a callback-based approach.

-- Helper procedure: add column only if it does not already exist
DROP PROCEDURE IF EXISTS V47_add_col;
CREATE PROCEDURE V47_add_col(IN p_table VARCHAR(64), IN p_column VARCHAR(64), IN p_definition VARCHAR(255))
BEGIN
  SET @col_exists = (SELECT COUNT(*) FROM information_schema.columns
                     WHERE table_schema = DATABASE() AND table_name = p_table AND column_name = p_column);
  IF @col_exists = 0 THEN
    SET @ddl = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_column, '` ', p_definition);
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END;

-- Helper procedure: add unique key only if it does not already exist
DROP PROCEDURE IF EXISTS V47_add_uk;
CREATE PROCEDURE V47_add_uk(IN p_table VARCHAR(64), IN p_key_name VARCHAR(64), IN p_columns VARCHAR(255))
BEGIN
  SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics
                     WHERE table_schema = DATABASE() AND table_name = p_table AND index_name = p_key_name);
  IF @idx_exists = 0 THEN
    SET @ddl = CONCAT('ALTER TABLE `', p_table, '` ADD UNIQUE KEY `', p_key_name, '` (', p_columns, ')');
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END;

-- 1. Optimistic locking version column on student_assignment (concurrent grading)
CALL V47_add_col('student_assignment', 'version', 'INT NOT NULL DEFAULT 0');

-- 2. Grading status: replace ambiguous int graded (0/1) with a proper status
CALL V47_add_col('student_assignment', 'grading_status', "VARCHAR(20) DEFAULT 'NOT_GRADED'");

-- Backfill existing data (safe to re-run)
UPDATE student_assignment SET grading_status = 'AUTO_GRADED' WHERE graded = 1 AND (grading_status IS NULL OR grading_status = 'NOT_GRADED');
UPDATE student_assignment SET grading_status = 'NOT_GRADED' WHERE graded = 0 AND grading_status IS NULL;

-- 3. Graded-by faculty ID and grading date as proper timestamp
CALL V47_add_col('student_assignment', 'graded_by', 'INT NULL');
CALL V47_add_col('student_assignment', 'graded_at', 'DATETIME NULL');

-- 4. Previous points for audit trail (stores points before last grade change)
CALL V47_add_col('student_assignment', 'previous_points', 'BIGINT DEFAULT 0');

-- 5. Optimistic locking version on assigned_exam (exam module concurrent grading)
CALL V47_add_col('assigned_exam', 'version', 'INT NOT NULL DEFAULT 0');

-- 6. LessonContents: deadline and max_attempts for quizzes
CALL V47_add_col('lesson_contents', 'deadline', 'DATETIME NULL');
CALL V47_add_col('lesson_contents', 'max_attempts', 'INT NOT NULL DEFAULT 1');

-- 7. StudentAssignment: attempt number tracking
CALL V47_add_col('student_assignment', 'attempt_number', 'INT NOT NULL DEFAULT 1');

-- 8. Quiz draft save table for auto-save/partial progress
CREATE TABLE IF NOT EXISTS quiz_draft (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    lesson_content_id INT NOT NULL,
    draft_data JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_quiz_draft_student_content (student_id, lesson_content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Grade audit log table
CREATE TABLE IF NOT EXISTS grade_audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_assignment_id INT NOT NULL,
    graded_by INT NOT NULL,
    previous_points BIGINT NOT NULL DEFAULT 0,
    new_points BIGINT NOT NULL DEFAULT 0,
    previous_grading_status VARCHAR(20) NULL,
    new_grading_status VARCHAR(20) NULL,
    action VARCHAR(50) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_grade_audit_assignment (student_assignment_id),
    INDEX idx_grade_audit_graded_by (graded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Unique constraint on student_assignment to enforce single submission per attempt
CALL V47_add_uk('student_assignment', 'uk_student_content_attempt', 'student_id, lesson_content_id, attempt_number');

-- Cleanup helper procedures
DROP PROCEDURE IF EXISTS V47_add_col;
DROP PROCEDURE IF EXISTS V47_add_uk;
