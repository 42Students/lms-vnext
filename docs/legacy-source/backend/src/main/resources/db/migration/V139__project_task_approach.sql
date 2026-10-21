-- Adds the "Approach" field to project tasks: the worked, how-to-do-this
-- guidance for a task, distinct from acceptance_criteria (the "done when"
-- condition). Same shape and same idempotent add-if-missing pattern as
-- acceptance_criteria (see V118__project_sprints.sql).
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'project_task' AND column_name = 'approach'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE project_task ADD COLUMN approach TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
