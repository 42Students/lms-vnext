-- Faculty and student coordinator roles were removed on 9 Oct 2026 (never planned; to be designed later). The placement
-- team is TPO admins only. Checked before writing this: prod and dev had no coordinator rows, no student-coordinator day
-- assignments and no attendance marked by a student coordinator.
-- tpo_team_member stays: it holds the faculty added as TPO admins.

DELETE FROM tpo_team_member WHERE role <> 'TPO_ADMIN';

SET @c := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tpo_team_member' AND COLUMN_NAME = 'department');
SET @ddl := IF(@c > 0, 'ALTER TABLE tpo_team_member DROP COLUMN department', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

ALTER TABLE tpo_team_member MODIFY role VARCHAR(25) NOT NULL DEFAULT 'TPO_ADMIN' COMMENT 'Always TPO_ADMIN';

DROP TABLE IF EXISTS tpo_coordinator_assignment;
