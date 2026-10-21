-- Sprint 4, Fix 19 cleanup: drop the legacy boolean feedback_recommend column.
-- V48 migrated existing data to feedback_recommend_action (VARCHAR 30).
-- This column is no longer written by application code.
-- MySQL < 8.0.29 does not support DROP COLUMN IF EXISTS, so check first.
SET @col_exists = (
    SELECT COUNT(1) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'interview'
      AND COLUMN_NAME = 'feedback_recommend'
);
SET @drop_col = IF(@col_exists > 0,
    'ALTER TABLE interview DROP COLUMN feedback_recommend',
    'SELECT 1');
PREPARE stmt FROM @drop_col;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
