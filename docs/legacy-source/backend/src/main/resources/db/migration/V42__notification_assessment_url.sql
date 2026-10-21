-- 21.1.5: assessment_url for JOB_ASSESSMENT_INVITE - Take Assessment CTA in notification dropdown
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notification' AND COLUMN_NAME = 'assessment_url');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE notification ADD COLUMN assessment_url VARCHAR(2048) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
