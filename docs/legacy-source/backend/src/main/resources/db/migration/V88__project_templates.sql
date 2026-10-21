CREATE TABLE IF NOT EXISTS project_template (
    id INT NOT NULL AUTO_INCREMENT,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    slug VARCHAR(80) NOT NULL,
    title VARCHAR(160) NOT NULL,
    summary TEXT NULL,
    course_label VARCHAR(160) NULL,
    status VARCHAR(40) DEFAULT 'IN_PROGRESS',
    phase VARCHAR(80) NULL,
    organization_id INT NOT NULL,
    college_id INT NOT NULL,
    created_by INT NULL,
    overview JSON NULL,
    milestones JSON NULL,
    tasks JSON NULL,
    resources JSON NULL,
    delivery JSON NULL,
    meetings JSON NULL,
    activity JSON NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_project_template_slug (slug),
    KEY idx_project_template_scope (organization_id, college_id),
    KEY idx_project_template_deleted (is_deleted)
);

SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_workspace' AND COLUMN_NAME = 'template_id'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE project_workspace ADD COLUMN template_id INT NULL',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_workspace' AND INDEX_NAME = 'idx_project_workspace_template_id'
);
SET @sql = IF(@idx_exists = 0,
    'CREATE INDEX idx_project_workspace_template_id ON project_workspace (template_id)',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_workspace' AND CONSTRAINT_NAME = 'fk_project_workspace_template'
);
SET @sql = IF(@fk_exists = 0,
    'ALTER TABLE project_workspace ADD CONSTRAINT fk_project_workspace_template FOREIGN KEY (template_id) REFERENCES project_template(id)',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
