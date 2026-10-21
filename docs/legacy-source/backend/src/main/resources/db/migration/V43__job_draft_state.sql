-- 10.1 / 21.2.7: Job draft state - Save as draft vs Publish
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'job' AND COLUMN_NAME = 'is_draft');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE job ADD COLUMN is_draft BOOLEAN NOT NULL DEFAULT FALSE',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
