-- Admin's only lever for a problem Student/Faculty account was hard delete (which also wipes
-- attendance/history) or, for faculty admins only, reusing is_deleted as a status toggle. Neither
-- gives a genuine reversible suspend. is_deleted is already overloaded for true hard-delete
-- semantics across many existing repository queries (filtered out of most findBy...NotDeleted
-- lookups), so this adds dedicated columns rather than reinterpreting it.
--
-- Guarded (matches the pattern established in V118/V119) because this shared dev database's
-- flyway_schema_history has been observed re-attempting already-applied recent migrations, and a
-- plain ADD COLUMN then fails with "Duplicate column name" and blocks every subsequent startup.
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'learner' AND column_name = 'suspended_at'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE learner ADD COLUMN suspended_at DATETIME NULL AFTER is_deleted', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'learner' AND column_name = 'suspension_reason'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE learner ADD COLUMN suspension_reason VARCHAR(500) NULL AFTER suspended_at', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'faculty' AND column_name = 'suspended_at'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE faculty ADD COLUMN suspended_at DATETIME NULL AFTER is_deleted', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'faculty' AND column_name = 'suspension_reason'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE faculty ADD COLUMN suspension_reason VARCHAR(500) NULL AFTER suspended_at', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
