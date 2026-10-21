-- Saved views: pin a few into the Views dropdown, and remember when each was last used (opened or downloaded), so the
-- dropdown can show recent ones and the manager can point out views nobody uses.

SET @c := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tpo_saved_view' AND COLUMN_NAME = 'pinned');
SET @ddl := IF(@c = 0, 'ALTER TABLE tpo_saved_view ADD COLUMN pinned TINYINT(1) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tpo_saved_view' AND COLUMN_NAME = 'last_used_at');
SET @ddl := IF(@c = 0, 'ALTER TABLE tpo_saved_view ADD COLUMN last_used_at DATETIME NULL', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tpo_saved_view' AND COLUMN_NAME = 'updated_at');
SET @ddl := IF(@c = 0, 'ALTER TABLE tpo_saved_view ADD COLUMN updated_at DATETIME NULL', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
