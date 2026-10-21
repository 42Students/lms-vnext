CREATE TABLE IF NOT EXISTS project_milestone (
    id INT NOT NULL AUTO_INCREMENT,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    project_id INT NOT NULL,
    milestone_key VARCHAR(120) NOT NULL,
    sort_order INT DEFAULT 0,
    title VARCHAR(220) NOT NULL,
    description TEXT NULL,
    milestone_status VARCHAR(40) DEFAULT 'UPCOMING',
    due_date DATE NULL,
    due_label VARCHAR(80) NULL,
    created_by INT NULL,
    updated_by INT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_project_milestone_key (project_id, milestone_key),
    KEY idx_project_milestone_project (project_id, is_deleted, sort_order, id),
    KEY idx_project_milestone_status (project_id, milestone_status, is_deleted),
    CONSTRAINT fk_project_milestone_project FOREIGN KEY (project_id) REFERENCES project_workspace(id)
);

SET @milestone_key_exists := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'project_task'
      AND column_name = 'milestone_key'
);
SET @sql := IF(
    @milestone_key_exists = 0,
    'ALTER TABLE project_task ADD COLUMN milestone_key VARCHAR(120) NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @milestone_label_exists := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'project_task'
      AND column_name = 'milestone_label'
);
SET @sql := IF(
    @milestone_label_exists = 0,
    'ALTER TABLE project_task ADD COLUMN milestone_label VARCHAR(220) NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @task_milestone_index_exists := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'project_task'
      AND index_name = 'idx_project_task_milestone'
);
SET @sql := IF(
    @task_milestone_index_exists = 0,
    'CREATE INDEX idx_project_task_milestone ON project_task (project_id, milestone_key, is_deleted)',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
