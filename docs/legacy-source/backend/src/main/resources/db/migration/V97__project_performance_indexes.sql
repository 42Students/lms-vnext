-- Composite indexes for hot Projects-module queries that were falling back to a full table
-- scan because no existing index led with the columns actually filtered/sorted on.

-- requireNoOrganizerConflict filters WHERE organizer_id = ? AND meeting_date = ? (deliberately
-- cross-workspace, no project_id predicate) on every single meeting write, but every existing
-- project_meeting index leads with project_id -- unusable for this query.
SET @idx_exists = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_meeting' AND INDEX_NAME = 'idx_project_meeting_organizer_conflict'
);
SET @sql = IF(@idx_exists = 0,
    'CREATE INDEX idx_project_meeting_organizer_conflict ON project_meeting (organizer_id, meeting_date, is_deleted)',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- findRecentByProjectIdAndMeetingKey filters on (project_id, meeting_key) but the existing
-- idx_project_meeting_history_meeting index is keyed on project_meeting_id (a numeric FK), not
-- the meeting_key string this query actually filters on.
SET @idx_exists = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_meeting_history' AND INDEX_NAME = 'idx_project_meeting_history_key'
);
SET @sql = IF(@idx_exists = 0,
    'CREATE INDEX idx_project_meeting_history_key ON project_meeting_history (project_id, meeting_key, created_at, id)',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- findActiveByCollegeId filters on college_id alone, and bulkCreateProjectsForClass's
-- duplicate-check filters on class_id alone -- but the only composite index
-- (idx_project_workspace_scope) leads with organization_id, so neither can use it
-- (leftmost-prefix rule).
SET @idx_exists = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_workspace' AND INDEX_NAME = 'idx_project_workspace_college'
);
SET @sql = IF(@idx_exists = 0,
    'CREATE INDEX idx_project_workspace_college ON project_workspace (college_id, is_deleted, updated_at)',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_workspace' AND INDEX_NAME = 'idx_project_workspace_class'
);
SET @sql = IF(@idx_exists = 0,
    'CREATE INDEX idx_project_workspace_class ON project_workspace (class_id, is_deleted)',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Same leftmost-prefix gap as project_workspace above, for the admin template-catalog list.
SET @idx_exists = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_template' AND INDEX_NAME = 'idx_project_template_college'
);
SET @sql = IF(@idx_exists = 0,
    'CREATE INDEX idx_project_template_college ON project_template (college_id, is_deleted, updated_at)',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- project_activity_event is read paginated as WHERE project_id = ? ORDER BY created_at DESC, id
-- DESC (the busiest of the audit-style tables, ~20 call sites) but only had single-column
-- indexes on project_id and created_at separately, forcing a filesort. Sibling tables
-- (project_meeting_history, project_resource_audit) already got this composite-index treatment.
SET @idx_exists = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'project_activity_event' AND INDEX_NAME = 'idx_project_activity_project_created'
);
SET @sql = IF(@idx_exists = 0,
    'CREATE INDEX idx_project_activity_project_created ON project_activity_event (project_id, created_at, id)',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
