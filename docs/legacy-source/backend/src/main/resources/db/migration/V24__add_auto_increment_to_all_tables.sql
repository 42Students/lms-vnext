-- ============================================================================
-- Migration V24: Add AUTO_INCREMENT to All Tables
-- ============================================================================
-- This migration fixes "Field 'id' doesn't have a default value" error
-- by adding AUTO_INCREMENT to the 'id' column for all tables that use
-- GenerationType.IDENTITY (either via BaseModel or directly).
--
-- Total Tables: 55
-- 
-- IMPORTANT: Foreign key checks are temporarily disabled to allow modification
-- of columns that are referenced by foreign keys (e.g., user.id referenced by
-- user_roles.USER_ID).
--
-- SAFETY: Each ALTER TABLE statement checks if the table exists before
-- attempting to modify it, preventing failures if tables are missing.
-- ============================================================================

-- Save current foreign key check setting and disable it
SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- CRITICAL TABLES (Currently causing errors - fix these first!)
-- ============================================================================
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'organization') > 0,
    'ALTER TABLE organization MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'college') > 0,
    'ALTER TABLE college MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'faculty_acct_verification') > 0,
    'ALTER TABLE faculty_acct_verification MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'learner_acct_verification') > 0,
    'ALTER TABLE learner_acct_verification MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================================
-- CORE USER & AUTHENTICATION TABLES (BaseModel)
-- ============================================================================
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user') > 0,
    'ALTER TABLE user MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'learner') > 0,
    'ALTER TABLE learner MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'faculty') > 0,
    'ALTER TABLE faculty MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'google_oauth_tokens') > 0,
    'ALTER TABLE google_oauth_tokens MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'login_user') > 0,
    'ALTER TABLE login_user MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'auth_token') > 0,
    'ALTER TABLE auth_token MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================================
-- APPLICATION & JOB TABLES (BaseModel + Direct IDENTITY)
-- ============================================================================
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'job') > 0,
    'ALTER TABLE job MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'job_application') > 0,
    'ALTER TABLE job_application MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'application_screening') > 0,
    'ALTER TABLE application_screening MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'interview') > 0,
    'ALTER TABLE interview MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'job_preferences') > 0,
    'ALTER TABLE job_preferences MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================================
-- COURSE & LEARNING TABLES (BaseModel)
-- ============================================================================
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'course') > 0,
    'ALTER TABLE course MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'qualification') > 0,
    'ALTER TABLE qualification MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'lesson') > 0,
    'ALTER TABLE lesson MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'lesson_contents') > 0,
    'ALTER TABLE lesson_contents MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'semester') > 0,
    'ALTER TABLE semester MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'semester_course') > 0,
    'ALTER TABLE semester_course MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================================
-- NOTIFICATION TABLES (BaseModel)
-- ============================================================================
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notification_template') > 0,
    'ALTER TABLE notification_template MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'lms_notification_template') > 0,
    'ALTER TABLE lms_notification_template MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notification') > 0,
    'ALTER TABLE notification MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================================
-- SKILLS TABLES (Direct IDENTITY)
-- ============================================================================
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'skills') > 0,
    'ALTER TABLE skills MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'skill_synonyms') > 0,
    'ALTER TABLE skill_synonyms MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================================
-- ORGANIZATIONAL STRUCTURE TABLES (BaseModel)
-- ============================================================================
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'department') > 0,
    'ALTER TABLE department MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'program') > 0,
    'ALTER TABLE program MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'new_program') > 0,
    'ALTER TABLE new_program MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'program_structure') > 0,
    'ALTER TABLE program_structure MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'new_program_structure') > 0,
    'ALTER TABLE new_program_structure MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'class') > 0,
    'ALTER TABLE class MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'lecture_hall') > 0,
    'ALTER TABLE lecture_hall MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'batch') > 0,
    'ALTER TABLE batch MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================================
-- ASSIGNMENT & SCHEDULING TABLES (BaseModel)
-- ============================================================================
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'class_schedule') > 0,
    'ALTER TABLE class_schedule MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'faculty_teaching_assignment') > 0,
    'ALTER TABLE faculty_teaching_assignment MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'faculty_course_mapping') > 0,
    'ALTER TABLE faculty_course_mapping MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'faculty_course_associations') > 0,
    'ALTER TABLE faculty_course_associations MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'student_assignment') > 0,
    'ALTER TABLE student_assignment MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attend') > 0,
    'ALTER TABLE attend MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================================
-- ADDITIONAL TABLES (BaseModel + Direct IDENTITY)
-- ============================================================================
SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'role') > 0,
    'ALTER TABLE role MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'discussions') > 0,
    'ALTER TABLE discussions MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'facial_recognition_result') > 0,
    'ALTER TABLE facial_recognition_result MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'learner_gmail_validation') > 0,
    'ALTER TABLE learner_gmail_validation MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'announcements') > 0,
    'ALTER TABLE announcements MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transaction_details') > 0,
    'ALTER TABLE transaction_details MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'student_fee_profiles') > 0,
    'ALTER TABLE student_fee_profiles MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fee_profiles') > 0,
    'ALTER TABLE fee_profiles MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'student_image') > 0,
    'ALTER TABLE student_image MODIFY COLUMN id INT AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Re-enable foreign key checks using the saved value
SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;
