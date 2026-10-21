-- V129: Indexes for the class-schedule / attendance read paths.
--
-- Every learner calendar, faculty calendar, take-attendance grid and attendance report resolves
-- through one of three access patterns, none of which had a supporting index:
--   * class_schedule by (class_id, start_time)   -- learner calendar, class attendance grid
--   * class_schedule by (faculty_id, start_time) -- faculty calendar, teaching-hours totals,
--                                                   upcoming-class lookup, conflict checks on
--                                                   create/update
--   * attend by class_schedule_id                -- absentee lookup for every report above
--     (the existing unique key uk_attend_student_schedule leads with student_id, so it cannot
--      serve a lookup that only knows the schedule id -- which is how every report queries it,
--      via `class_schedule_id IN (...)`)
--
-- Follows the idempotent CALL pattern established in V52 so re-running against a database that
-- already has any of these indexes is a no-op.

DROP PROCEDURE IF EXISTS V129_add_idx;
CREATE PROCEDURE V129_add_idx(IN p_table VARCHAR(64), IN p_index VARCHAR(64), IN p_columns VARCHAR(255))
BEGIN
  SET @tbl_exists = (SELECT COUNT(*) FROM information_schema.tables
                     WHERE table_schema = DATABASE() AND table_name = p_table);
  SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics
                     WHERE table_schema = DATABASE() AND table_name = p_table AND index_name = p_index);
  IF @tbl_exists > 0 AND @idx_exists = 0 THEN
    SET @ddl = CONCAT('ALTER TABLE `', p_table, '` ADD INDEX `', p_index, '` (', p_columns, ')');
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END;

CALL V129_add_idx('class_schedule', 'idx_class_schedule_class_start', 'class_id, start_time');
CALL V129_add_idx('class_schedule', 'idx_class_schedule_faculty_start', 'faculty_id, start_time');
CALL V129_add_idx('attend', 'idx_attend_class_schedule_id', 'class_schedule_id');

DROP PROCEDURE IF EXISTS V129_add_idx;
