SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_template' AND COLUMN_NAME = 'template_version'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE project_template ADD COLUMN template_version INT NOT NULL DEFAULT 1',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_template' AND COLUMN_NAME = 'lifecycle_status'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE project_template ADD COLUMN lifecycle_status VARCHAR(20) NOT NULL DEFAULT ''DRAFT''',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_template' AND COLUMN_NAME = 'published_at'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE project_template ADD COLUMN published_at DATETIME NULL',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_template' AND COLUMN_NAME = 'archived_at'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE project_template ADD COLUMN archived_at DATETIME NULL',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE project_template
SET template_version = COALESCE(template_version, 1),
    lifecycle_status = COALESCE(lifecycle_status, 'DRAFT');
