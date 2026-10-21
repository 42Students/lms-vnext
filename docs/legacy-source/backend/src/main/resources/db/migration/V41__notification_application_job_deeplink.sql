-- Phase 4 - Gap 8.7: Notification deep link to application
-- application_id, job_id enable frontend to route to /learn/my-applications with focus on specific application

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notification' AND COLUMN_NAME = 'application_id');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE notification ADD COLUMN application_id INT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notification' AND COLUMN_NAME = 'job_id');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE notification ADD COLUMN job_id INT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
