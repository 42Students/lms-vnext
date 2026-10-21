SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_workspace' AND COLUMN_NAME = 'readiness_override'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE project_workspace ADD COLUMN readiness_override BOOLEAN NULL',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_workspace' AND COLUMN_NAME = 'readiness_override_note'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE project_workspace ADD COLUMN readiness_override_note TEXT NULL',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_workspace' AND COLUMN_NAME = 'readiness_override_by'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE project_workspace ADD COLUMN readiness_override_by INT NULL',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_workspace' AND COLUMN_NAME = 'readiness_override_at'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE project_workspace ADD COLUMN readiness_override_at DATETIME NULL',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS project_settings (
    id INT NOT NULL AUTO_INCREMENT,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    college_id INT NOT NULL,
    organization_id INT NULL,
    default_template_id INT NULL,
    require_mentor_before_active BOOLEAN NOT NULL DEFAULT FALSE,
    allow_learner_self_enroll BOOLEAN NOT NULL DEFAULT FALSE,
    auto_archive_after_days INT NULL,
    updated_by INT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_project_settings_college (college_id)
);
