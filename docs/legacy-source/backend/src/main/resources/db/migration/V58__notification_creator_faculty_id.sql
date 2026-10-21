-- IDOR fix: track which faculty created each notification so delete is restricted to owner or admin
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'notification'
    AND COLUMN_NAME = 'creator_faculty_id'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE notification ADD COLUMN creator_faculty_id INT NULL',
    'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
