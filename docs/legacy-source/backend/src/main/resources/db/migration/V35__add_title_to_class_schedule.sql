SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'class_schedule' AND COLUMN_NAME = 'title');

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE class_schedule ADD COLUMN title VARCHAR(500) NULL',
    'SELECT 1');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
