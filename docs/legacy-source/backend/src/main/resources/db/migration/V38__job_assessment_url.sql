-- Add assessment_url for external online assessment link (set when company provides it)
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'job' AND COLUMN_NAME = 'assessment_url');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE job ADD COLUMN assessment_url VARCHAR(2048) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
