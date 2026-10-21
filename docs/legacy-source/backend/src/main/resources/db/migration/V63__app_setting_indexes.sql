-- MySQL compatibility note:
-- `CREATE INDEX IF NOT EXISTS` isn't supported on many MySQL versions.
-- Use INFORMATION_SCHEMA check + dynamic SQL to keep this migration idempotent.

SET @sql := IF(
  (SELECT COUNT(*)
     FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'app_setting'
      AND INDEX_NAME = 'idx_app_setting_scope_key') = 0,
  'CREATE INDEX idx_app_setting_scope_key ON app_setting (scope_type, scope_id, setting_key)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
