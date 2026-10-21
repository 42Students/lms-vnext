-- Add task-level blocker reason so the board can show explicit blocked context.

SET @sql := IF(
  (SELECT COUNT(*)
     FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'project_task'
      AND COLUMN_NAME = 'blocker_reason') = 0,
  'ALTER TABLE project_task ADD COLUMN blocker_reason TEXT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
