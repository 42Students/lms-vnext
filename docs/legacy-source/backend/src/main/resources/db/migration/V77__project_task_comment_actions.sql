-- Add explicit review/block/action metadata to project task comments.
-- comment_type lets the UI distinguish plain notes from review/block/progress updates.
-- task_status_snapshot stores the task state when the comment was created.

SET @sql := IF(
  (SELECT COUNT(*)
     FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'project_task_comment'
      AND COLUMN_NAME = 'comment_type') = 0,
  'ALTER TABLE project_task_comment ADD COLUMN comment_type VARCHAR(30) NOT NULL DEFAULT ''NOTE''',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (SELECT COUNT(*)
     FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'project_task_comment'
      AND COLUMN_NAME = 'task_status_snapshot') = 0,
  'ALTER TABLE project_task_comment ADD COLUMN task_status_snapshot VARCHAR(30) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
