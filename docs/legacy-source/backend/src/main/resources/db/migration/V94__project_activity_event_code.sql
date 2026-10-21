-- event_key holds a UUID-suffixed unique row identifier and event_type holds the human-readable
-- label the Activity tab displays — neither is a stable machine-readable code a future API
-- consumer (mobile app, reporting) could reliably filter on. Add a dedicated column for that
-- instead of repurposing either existing field, since both already have tested, working
-- behavior on the frontend.
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_activity_event' AND COLUMN_NAME = 'event_code'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE project_activity_event ADD COLUMN event_code VARCHAR(60) NULL AFTER event_key',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_activity_event' AND INDEX_NAME = 'idx_project_activity_event_code'
);
SET @sql = IF(@idx_exists = 0,
    'CREATE INDEX idx_project_activity_event_code ON project_activity_event (project_id, event_code)',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
