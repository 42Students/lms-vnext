SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_workspace' AND COLUMN_NAME = 'version'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE project_workspace ADD COLUMN version BIGINT NOT NULL DEFAULT 0',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_task' AND COLUMN_NAME = 'version'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE project_task ADD COLUMN version BIGINT NOT NULL DEFAULT 0',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_milestone' AND COLUMN_NAME = 'version'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE project_milestone ADD COLUMN version BIGINT NOT NULL DEFAULT 0',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_resource' AND COLUMN_NAME = 'version'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE project_resource ADD COLUMN version BIGINT NOT NULL DEFAULT 0',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_meeting' AND COLUMN_NAME = 'version'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE project_meeting ADD COLUMN version BIGINT NOT NULL DEFAULT 0',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
