-- V52: Add index on is_deleted for attend table to speed up soft-delete queries.
-- The unique constraint (student_id, class_schedule_id) was already added in V29.
-- This migration only adds the missing index using idempotent approach.

DROP PROCEDURE IF EXISTS V52_add_idx;
CREATE PROCEDURE V52_add_idx(IN p_table VARCHAR(64), IN p_index VARCHAR(64), IN p_columns VARCHAR(255))
BEGIN
  SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics
                     WHERE table_schema = DATABASE() AND table_name = p_table AND index_name = p_index);
  IF @idx_exists = 0 THEN
    SET @ddl = CONCAT('ALTER TABLE `', p_table, '` ADD INDEX `', p_index, '` (', p_columns, ')');
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END;

CALL V52_add_idx('attend', 'idx_attend_is_deleted', 'is_deleted');

DROP PROCEDURE IF EXISTS V52_add_idx;
