-- Gap #12: interview_id for deep link to specific interview (e.g. /learn/interviews?highlight=123)
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notification' AND COLUMN_NAME = 'interview_id');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE notification ADD COLUMN interview_id INT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
