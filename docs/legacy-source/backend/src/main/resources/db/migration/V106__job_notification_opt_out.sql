-- Every job/interview status-change notification used to fire unconditionally with no way for
-- a learner to opt out. Default TRUE (opt-out, not opt-in) so existing behavior is unchanged
-- until a learner explicitly turns it off.
SET @col_exists = (
    SELECT COUNT(1) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'job_preferences'
      AND COLUMN_NAME = 'job_notifications_enabled'
);
SET @add_col = IF(@col_exists = 0,
    'ALTER TABLE job_preferences ADD COLUMN job_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE',
    'SELECT 1');
PREPARE stmt FROM @add_col; EXECUTE stmt; DEALLOCATE PREPARE stmt;
