-- Add important_dates JSON column for job milestones (Application deadline, Screening round, etc.)
-- Idempotent: only add column if it does not exist (avoids "Duplicate column name" when column was added manually or by a previous run)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'job' AND COLUMN_NAME = 'important_dates');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE job ADD COLUMN important_dates JSON NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
