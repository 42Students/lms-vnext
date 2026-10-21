-- Phase 2: Rejection & Assessment - Data model extensions

-- 1.1 JobApplication.rejectionReason - reason when moving to REJECTED
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'job_application' AND COLUMN_NAME = 'rejection_reason');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE job_application ADD COLUMN rejection_reason VARCHAR(500) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1.2 Interview.durationMinutes - persist duration for calendar display
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'interview' AND COLUMN_NAME = 'duration_minutes');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE interview ADD COLUMN duration_minutes INT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1.3 Job.assessmentDeadline - deadline for completing assessment
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'job' AND COLUMN_NAME = 'assessment_deadline');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE job ADD COLUMN assessment_deadline DATETIME NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
