-- ProjectTemplate was the only mutable Project* entity with no optimistic-lock version column —
-- every sibling (ProjectWorkspace, ProjectMember, ProjectTask, ProjectMilestone, ProjectMeeting,
-- ProjectResource, ProjectSettings, ProjectDelivery) already has one (V91, V95). templateVersion
-- is a separate manual business counter, not a JPA-managed lock token, so two concurrent admin
-- edits of the same template previously silently overwrote each other.
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_template' AND COLUMN_NAME = 'version'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE project_template ADD COLUMN version BIGINT NOT NULL DEFAULT 0',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
